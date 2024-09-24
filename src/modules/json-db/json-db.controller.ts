import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { ValidatorService } from '../shared/validator.service';
import { JsonDbService } from './json-db.service';

const errorSchema = {
  type: 'object', properties: {
    error: { type: 'string', description: 'Error Message' }
  }
};
const badRequestApiResponse          = { status: HttpStatus.BAD_REQUEST          , description: 'Invalid Request', schema: errorSchema };
const internalServerErrorApiResponse = { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Somwthing Wrong', schema: errorSchema };

@Controller('json-db')
export class JsonDbController {
  constructor(
    private readonly validatorService: ValidatorService,
    private readonly jsonDbService: JsonDbService
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
  public listDbNames(@Body('credential') credential: string, @Res() res: Response): Response {
    try {
      if(!this.validateCredential(credential, res)) return;
      
      const dbNames = this.jsonDbService.listDbNames();
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
      if(this.jsonDbService.existsDbName(dbName)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Name Of DB Already Exists' });
    
      await this.jsonDbService.createDb(dbName, dbCredential);
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
      if(!this.validateDb(dbName, dbCredential, res)) return;
      
      await this.jsonDbService.deleteDb(dbName, dbCredential);
      return res.status(HttpStatus.NO_CONTENT).json({ result: 'Deleted' });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Delete DB : ${error.toString()}` });
    }
  }
  
  @Post('find-all')
  @ApiOperation({ summary: 'Find All' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Results', schema: { type: 'object', properties: {
    results: { type: 'array', description: 'Results', items: { type: 'object', description: 'Result Item' }}
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async findAll(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      
      const results = await this.jsonDbService.findAll(dbName);
      return res.status(HttpStatus.OK).json({ results });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Find All : ${error.toString()}` });
    }
  }
  
  @Post('find-by-id')
  @ApiOperation({ summary: 'Find By ID' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    id           : { type: 'number', description: 'ID'}
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Result Or Null', schema: { type: 'object', properties: {
    result: { anyOf: [ { type: 'object', description: 'Result' }, { type: 'null' } ], description: 'Result Or Null', example: '{} or null'}
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async findById(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('id') id: number, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      
      const result = await this.jsonDbService.findById(dbName, id);
      return res.status(HttpStatus.OK).json({ result });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Find By ID : ${error.toString()}` });
    }
  }
  
  @Post('create')
  @ApiOperation({ summary: 'Create' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    item         : { type: 'object', description: 'Item'}
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Created Item', schema: { type: 'object', properties: {
    result: { type: 'object', description: 'Created Item' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async create(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('item') item: any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(!this.validatorService.isObject(item)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Is Not A Object' });
      
      const result = await this.jsonDbService.create(dbName, item);
      return res.status(HttpStatus.OK).json({ result });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Create : ${error.toString()}` });
    }
  }
  
  @Post('put-by-id')
  @ApiOperation({ summary: 'Put By ID' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    id           : { type: 'number', description: 'ID' },
    item         : { type: 'object', description: 'Item'}
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Put Item', schema: { type: 'object', properties: {
    result: { type: 'object', description: 'Put Item' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async putById(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('id') id: number, @Body('item') item: any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(!this.validatorService.isObject(item)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Is Not A Object' });
      
      const result = await this.jsonDbService.putById(dbName, id, item);
      if(result == null) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Not Found (Invalid ID)' });
      return res.status(HttpStatus.OK).json({ result });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Put By ID : ${error.toString()}` });
    }
  }
  
  @Post('patch-by-id')
  @ApiOperation({ summary: 'Patch By ID' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    id           : { type: 'number', description: 'ID' },
    item         : { type: 'object', description: 'Item'}
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Patched Item', schema: { type: 'object', properties: {
    result: { type: 'object', description: 'Patched Item' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async patchById(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('id') id: number, @Body('item') item: any, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      if(!this.validatorService.isObject(item)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Is Not A Object' });
      
      const result = await this.jsonDbService.patchById(dbName, id, item);
      if(result == null) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Not Found (Invalid ID)' });
      return res.status(HttpStatus.OK).json({ result });
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Patch By ID : ${error.toString()}` });
    }
  }
  
  @Post('delete-by-id')
  @ApiOperation({ summary: 'Delete By ID' })
  @ApiBody({ schema: { type: 'object', properties: {
    db_name      : { type: 'string', description: 'DB Name' },
    db_credential: { type: 'string', description: 'DB Credential' },
    id           : { type: 'number', description: 'ID' }
  }}})
  @ApiResponse({ status: HttpStatus.OK, description: 'Deleted Item', schema: { type: 'object', properties: {
    result: { type: 'object', description: 'Deleted Item' }
  }}})
  @ApiResponse(badRequestApiResponse)
  @ApiResponse(internalServerErrorApiResponse)
  public async deleteById(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('id') id: number, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      
      const result = await this.jsonDbService.deleteById(dbName, id);
      if(result == null) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Not Found (Invalid ID)' });
      return res.status(HttpStatus.OK).json({ result });  // No Content 204 だと JSON がレスポンスされないため OK にしておく
    }
    catch(error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Delete By ID : ${error.toString()}` });
    }
  }
  
  private validateCredential(credential: string, res: Response): boolean {
    if(!this.validatorService.validateCredential(credential)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Credential' });
      return false;
    }
    return true;
  }
  
  private validateDb(dbName: string, dbCredential: string, res: Response): boolean {
    const validateResult = this.validatorService.validateDbInput(dbName, dbCredential);
    if(validateResult) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: validateResult });
      return false;
    }
    
    if(!this.jsonDbService.existsDb(dbName, dbCredential)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'The DB Does Not Exist' });
      return false;
    }
    
    return true;
  }
}
