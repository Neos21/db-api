import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { ValidatorService } from '../shared/validator.service';
import { JsonDbService } from './json-db.service';

@Controller('json-db')
export class JsonDbController {
  constructor(
    private readonly validatorService: ValidatorService,
    private readonly jsonDbService: JsonDbService
  ) { }
  
  @Post('list-db-names')
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
  public async deleteById(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('id') id: number, @Res() res: Response): Promise<Response> {
    try {
      if(!this.validateDb(dbName, dbCredential, res)) return;
      
      const result = await this.jsonDbService.deleteById(dbName, id);
      if(result == null) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Item Not Found (Invalid ID)' });
      return res.status(HttpStatus.OK).json({ result });  // No Content 204 だと JSON がレスポンスされないため
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
