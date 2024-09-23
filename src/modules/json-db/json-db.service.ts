import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ValidateCredentialService } from '../shared/validate-credential.service';

import { Low } from '../../low-db/core-low';
import { JSONFilePreset } from '../../low-db/presets';
import { ConfigService } from '@nestjs/config';

type Database = {
  dbName: string,
  dbCredential: string
};
type MasterDbData = {
  databases: Array<Database>
};

@Injectable()
export class JsonDbService {
  private readonly dbDirectoryPath: string;
  private readonly jsonDbDirectoryPath: string;
  private masterDb: Low<MasterDbData>;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly validateCredentialService: ValidateCredentialService
  ) {
    this.dbDirectoryPath     = this.configService.get('dbDirectoryPath');
    this.jsonDbDirectoryPath = this.configService.get('jsonDbDirectoryPath');
    (async () => {
      await fs.mkdir(this.dbDirectoryPath    , { recursive: true });
      await fs.mkdir(this.jsonDbDirectoryPath, { recursive: true });
      this.masterDb = await JSONFilePreset<MasterDbData>(path.resolve(this.dbDirectoryPath, 'master-db.json'), { databases: [] });
    })();
  }
  
  /** DB 名一覧を返す */
  public listDbNames(): Array<string> {
    return this.masterDb.data.databases.map(database => database.dbName);
  }
  
  /** DB ファイルを作成する */
  public async createDb(dbName: string, dbCredential: string): Promise<true | string> {
    try {
      const db = await JSONFilePreset(path.resolve(this.jsonDbDirectoryPath, `${dbName}.json`), { });  // TODO : 初期値
      await db.write();
      
      this.masterDb.data.databases.push({ dbName, dbCredential });
      await this.masterDb.write();
      
      return true;
    }
    catch(error) {
      return error.toString();
    }
  }
  
  /** DB ファイルを削除する */
  public async deleteDb(dbName: string, dbCredential: string): Promise<true | string> {
    try {
      const index = this.masterDb.data.databases.findIndex(database => database.dbName === dbName && database.dbCredential === dbCredential);
      if(index < 0) throw new Error('The DB Not Found');  // 事前に `existsDb()` でチェックしているはずなので起こらない想定
      this.masterDb.data.databases.splice(index, 1);
      await this.masterDb.write();
      
      await fs.unlink(path.resolve(this.jsonDbDirectoryPath, `${dbName}.json`));  // ファイルが存在しない場合はエラーになる
      
      return true;
    }
    catch(error) {
      return error.toString();
    }
  }
  
  /** DB 名と DB クレデンシャルの値が正常か否か */
  public validateDbInput(dbName: string, dbCredential: string): true | string {
    if(this.validateCredentialService.isEmpty(dbName)      ) return 'DB Name Is Empty';
    if(this.validateCredentialService.isEmpty(dbCredential)) return 'DB Credential Is Empty';
    if(dbName.length       > 50) return 'DB Name Is Too Long';
    if(dbCredential.length <  8) return 'DB Credential Is Too Short. Please Input 8 Characters Or More';
    if(dbCredential.length > 20) return 'DB Credential Is Too Long. Please Input 20 Characters Or Less';
    if(!(/^[a-z]+[a-z-]*[^-]$/u).test(dbName)) return 'Invalid DB Name Pattern';  // 半角小文字・ハイフンケースのみ許容する
    return true;
  }
  
  /** 指定の DB 名がマスター DB に定義されているか否か */
  public existsDbName(dbName: string): boolean {
    const foundDatabase = this.masterDb.data.databases.find(database => database.dbName === dbName);
    return foundDatabase != null;
  }
  
  /** DB 名と DB クレデンシャルが一致する DB がマスター DB に定義されているか否か */
  public existsDb(dbName: string, dbCredential: string): boolean {
    const foundDatabase = this.masterDb.data.databases.find(database => database.dbName === dbName && database.dbCredential === dbCredential);
    return foundDatabase != null;
  }
}
