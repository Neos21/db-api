import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { ValidatorService } from '../shared/validator.service';
import { SqliteService } from './sqlite.service';

const errorSchema = {
  type: 'object', properties: {
    error: { type: 'string', description: 'Error Message' }
  }
};
const badRequestApiResponse          = { status: HttpStatus.BAD_REQUEST          , description: 'Invalid Request', schema: errorSchema };
const internalServerErrorApiResponse = { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Something Wrong', schema: errorSchema };

@Controller('sqlite')
export class SqliteController {
  constructor(
    private readonly validatorService: ValidatorService,
    private readonly sqliteService: SqliteService
  ) { }
  
  @Post('list-db-names')
  @ApiOperation({ summary: 'List DB Names' })
  @ApiBody({ schema: { type: 'object', properties: {
    credential: { type: 'string', description: 'Credential' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'DB Names', schema: { type: 'object', properties: {
    db_names: { type: 'array', description: 'DB Names', items: { type: 'string' }}
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async listDbNames(@Body('credential') credential: string, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateCredential(credential, res)) return;
      
      const dbNames = await this.sqliteService.listDbNames();
      return res.status(HttpStatus.OK).json({ db_names: dbNames });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To List DB Names : ${error.toString()}` });
    }
  }
  
  @Post('create-db')
  @ApiOperation({ summary: 'Create DB' })
  @ApiBody({ schema: { type: 'object', properties: {
    credential   : { type: 'string', description: 'Credential' },
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Success Message', schema: { type: 'object', properties: {
    result: { type: 'string', description: 'Created', example: 'Created' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async createDb(@Body('credential') credential: string, @Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateCredential(credential, res)) return;
      const validateResult = this.validatorService.validateDbInput(dbName, dbCredential);
      if(validateResult) return res.status(HttpStatus.BAD_REQUEST).json({ error: validateResult });
      if(await this.sqliteService.existsDbName(dbName)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Name Of DB Already Exists' });
    
      await this.sqliteService.createDb(dbName, dbCredential);
      return res.status(HttpStatus.CREATED).json({ result: 'Created' });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Create DB : ${error.toString()}` });
    }
  }
  
  @Post('delete-db')
  @ApiOperation({ summary: 'Delete DB' })
  @ApiBody({ schema: { type: 'object', properties: {
    credential   : { type: 'string', description: 'Credential' },
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Success Message', schema: { type: 'object', properties: {
    result: { type: 'string', description: 'Deleted', example: 'Deleted' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async deleteDb(@Body('credential') credential: string, @Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateCredential(credential, res)) return;
      if(! await this.validateDb(dbName, dbCredential, res)) return;
      
      await this.sqliteService.deleteDb(dbName, dbCredential);
      return res.status(HttpStatus.NO_CONTENT).json({ result: 'Deleted' });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Delete DB : ${error.toString()}` });
    }
  }
  
  @Post('run')
  @ApiOperation({ summary: 'Run' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    sql          : { type: 'string', description: 'SQL' },
    params       : { anyOf: [
      { type: 'array' , description: 'Params Array', items: { type: 'object', description: 'Param Item' } },
      { type: 'object', description: 'Params Object' }
    ], description: 'Params', example: '{} or []' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Result Or Null', schema: { type: 'object', properties: {
    result: { anyOf: [ { type: 'object', description: 'Result' }, { type: 'null' } ], description: 'Result Or Null', example: '{} or null' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async run(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('sql') sql: string, @Body('params') params: Array<any> | any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(this.validatorService.isEmpty(sql)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The SQL Is Empty' });
      
      const result = await this.sqliteService.run(dbName, sql, params);
      return res.status(HttpStatus.OK).json({ result: result ?? null });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Run : ${error.toString()}` });
    }
  }
  
  @Post('get')
  @ApiOperation({ summary: 'Get' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    sql          : { type: 'string', description: 'SQL' },
    params       : { anyOf: [
      { type: 'array' , description: 'Params Array', items: { type: 'object', description: 'Param Item' } },
      { type: 'object', description: 'Params Object' }
    ], description: 'Params', example: '{} or []' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Result Or Null', schema: { type: 'object', properties: {
    result: { anyOf: [ { type: 'object', description: 'Result' }, { type: 'null' } ], description: 'Result Or Null', example: '{} or null' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async get(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('sql') sql: string, @Body('params') params: Array<any> | any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(this.validatorService.isEmpty(sql)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The SQL Is Empty' });
      
      const result = await this.sqliteService.get(dbName, sql, params);
      return res.status(HttpStatus.OK).json({ result: result ?? null });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Get : ${error.toString()}` });
    }
  }
  
  @Post('all')
  @ApiOperation({ summary: 'All' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    sql          : { type: 'string', description: 'SQL' },
    params       : { anyOf: [
      { type: 'array' , description: 'Params Array', items: { type: 'object', description: 'Param Item' } },
      { type: 'object', description: 'Params Object' }
    ], description: 'Params', example: '{} or []' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Results Or Null', schema: { type: 'object', properties: {
    results: { anyOf: [ { type: 'array', items: { type: 'object', description: 'Results' } }, { type: 'null' } ], description: 'Results Or Null', example: '[{}] or null' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async all(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('sql') sql: string, @Body('params') params: Array<any> | any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(this.validatorService.isEmpty(sql)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The SQL Is Empty' });
      
      const results = await this.sqliteService.all(dbName, sql, params);
      return res.status(HttpStatus.OK).json({ results: results ?? null });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Get : ${error.toString()}` });
    }
  }
  
  private validateCredential(credential: string, res: Response): boolean {
    if(!this.validatorService.validateCredential(credential)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Credential' });
      return false;
    }
    return true;
  }
  
  private async validateDb(dbName: string, dbCredential: string, res: Response): Promise<boolean> {
    const validateResult = this.validatorService.validateDbInput(dbName, dbCredential);
    if(validateResult) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: validateResult });
      return false;
    }
    
    if(! await this.sqliteService.existsDb(dbName, dbCredential)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'The DB Does Not Exist' });
      return false;
    }
    
    return true;
  }
}
