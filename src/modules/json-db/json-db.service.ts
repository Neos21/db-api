import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ValidateCredentialService } from '../shared/validate-credential.service';
import { Low } from '../../low-db/core-low';
import { JSONFilePreset } from '../../low-db/presets';

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
  public async createDb(dbName: string, dbCredential: string): Promise<void> {
    const db = await this.createOrReadDb(dbName);
    await db.write();
    
    this.masterDb.data.databases.push({ dbName, dbCredential });
    await this.masterDb.write();
  }
  
  /** DB ファイルを削除する */
  public async deleteDb(dbName: string, dbCredential: string): Promise<void> {
    const index = this.masterDb.data.databases.findIndex(database => database.dbName === dbName && database.dbCredential === dbCredential);
    if(index < 0) throw new Error('The DB Not Found');  // 事前チェックしているので起こらないはずだが念のため
    this.masterDb.data.databases.splice(index, 1);
    await this.masterDb.write();
    
    await fs.unlink(path.resolve(this.jsonDbDirectoryPath, `${dbName}.json`));  // ファイルが存在しない場合はエラーになる
  }
  
  /** 全件取得する */
  public async findAll(dbName: string): Promise<Array<any>> {
    const db = await this.createOrReadDb(dbName);
    return db.data;
  }
  
  /** ID を指定して1件取得する */
  public async findById(dbName: string, id: number): Promise<any | null> {
    const db = await this.createOrReadDb(dbName);
    return db.data.find(item => item.id === id) ?? null;
  }
  
  /** 引数の連想配列に ID を採番して追加する */
  public async create(dbName: string, item: any): Promise<any> {
    const db = await this.createOrReadDb(dbName);
    const currentMaxId = db.data.length ? Math.max(...db.data.map(item => item.id)) : 0;
    const newId = currentMaxId + 1;
    item.id = newId;
    db.data.push(item);
    await db.write();
    return item;  // 作成した Item を返しておく
  }
  
  /** ID を指定して1件入替更新する */
  public async putById(dbName: string, id: number, item: any): Promise<any | null> {
    const db = await this.createOrReadDb(dbName);
    const itemIndex = db.data.findIndex(item => item.id === id);
    if(itemIndex < 0) return null;  // 更新対象が見つからなかった
    db.data[itemIndex]    = item;  // 全要素まとめて入替更新
    db.data[itemIndex].id = id;
    await db.write();
    return db.data[itemIndex];  // 更新後の Item を返しておく
  }
  
  /** ID を指定して1件部分置換で更新する */
  public async patchById(dbName: string, id: number, item: any): Promise<any | null> {
    const db = await this.createOrReadDb(dbName);
    const itemIndex = db.data.findIndex(item => item.id === id);
    if(itemIndex < 0) return null;  // 更新対象が見つからなかった
    Object.entries(item).forEach(([key, value]) => {  // 指定要素のみ部分置換
      if(value === undefined) {
        delete db.data[itemIndex][key];  // `undefined` が指定されていた場合はキーごと削除する
      }
      else {
        db.data[itemIndex][key] = value;  // `null` の値を含む
      }
    });
    db.data[itemIndex].id = id;
    await db.write();
    return db.data[itemIndex];  // 更新後の Item を返しておく
  }
  
  /** ID を指定して1件削除する */
  public async deleteById(dbName: string, id: number): Promise<any | null> {
    const db = await this.createOrReadDb(dbName);
    const itemIndex = db.data.findIndex(item => item.id === id);
    if(itemIndex < 0) return null;  // 削除対象が見つからなかった
    const item = db.data[itemIndex];
    db.data.splice(itemIndex, 1);
    await db.write();
    return item;  // 削除した Item を返しておく
  }
  
  /** DB 名と DB クレデンシャルの値が正常か否か・不正な場合はエラーメッセージを返す */
  public validateDbInput(dbName: string, dbCredential: string): string | null {
    if(this.validateCredentialService.isEmpty(dbName)      ) return 'DB Name Is Empty';
    if(this.validateCredentialService.isEmpty(dbCredential)) return 'DB Credential Is Empty';
    if(dbName.length       > 50) return 'DB Name Is Too Long';
    if(dbCredential.length <  8) return 'DB Credential Is Too Short. Please Input 8 Characters Or More';
    if(dbCredential.length > 20) return 'DB Credential Is Too Long. Please Input 20 Characters Or Less';
    if(!(/^[a-z]+[a-z-]*[^-]$/u).test(dbName)) return 'Invalid DB Name Pattern';  // 半角小文字・ハイフンケースのみ許容する
    return null;
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
  
  /** DB を読み込む・存在しない場合はデフォルト値を当てる */
  private async createOrReadDb(dbName: string): Promise<Low<any[]>> {
    return await JSONFilePreset(path.resolve(this.jsonDbDirectoryPath, `${dbName}.json`), []);
  }
  
  /** 引数が連想配列か否か・Array や Function も除く */
  public isObject(item: any): boolean {
    return item != null && item?.constructor?.name === 'Object';
  }
}
