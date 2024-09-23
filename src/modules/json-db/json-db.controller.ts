import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { ValidateCredentialService } from '../shared/validate-credential.service';
import { JsonDbService } from './json-db.service';

@Controller('json-db')
export class JsonDbController {
  constructor(
    private readonly validateCredentialService: ValidateCredentialService,
    private readonly jsonDbService: JsonDbService
  ) { }
  
  @Post('list')
  public listDbNames(@Body('credential') credential: string, @Res() res: Response): Response {
    if(!this.validateCredentialService.validateCredential(credential)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Credential' });
    }
    
    const dbNames = this.jsonDbService.listDbNames();
    return res.status(HttpStatus.OK).json({ db_names: dbNames });
  }
  
  @Post('create')
  public async createDb(@Body('credential') credential: string, @Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Res() res: Response): Promise<Response> {
    if(!this.validateCredentialService.validateCredential(credential)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Credential' });
    }
    
    const validateResult = this.jsonDbService.validateDbInput(dbName, dbCredential);
    if(validateResult !== true) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: validateResult });
    }
    
    if(this.jsonDbService.existsDbName(dbName)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The Name Of DB Already Exists' });
    }
    
    const createResult = await this.jsonDbService.createDb(dbName, dbCredential);
    if(createResult !== true) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Create DB : ${createResult}` });
    }
    
    return res.status(HttpStatus.CREATED).end();
  }
  
  @Post('delete')
  public async deleteDb(@Body('credential') credential: string, @Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Res() res: Response): Promise<Response> {
    if(!this.validateCredentialService.validateCredential(credential)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Credential' });
    }
    
    const validateResult = this.jsonDbService.validateDbInput(dbName, dbCredential);
    if(validateResult !== true) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: validateResult });
    }
    
    if(!this.jsonDbService.existsDb(dbName, dbCredential)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'The DB Does Not Exist' });
    }
    
    const deleteResult = await this.jsonDbService.deleteDb(dbName, dbCredential);
    if(deleteResult !== true) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `Failed To Delete DB : ${deleteResult}` });
    }
    
    return res.status(HttpStatus.NO_CONTENT).end();
  }
  
  @Post('run')
  public runQuery(@Body('db_name') dbName: string, @Body('db_credential') dbCredential: string, @Body('prepared_statement') preparedStatement: string, @Body('binds') binds: Array<string>, @Res() res: Response): Response {
    // TODO
    return res.status(HttpStatus.OK).json({ result: {} });
  }
}
