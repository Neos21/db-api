import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as util from 'node:util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Database } from 'sqlite3';

@Injectable()
export class SqliteService {
  private readonly dbDirectoryPath: string;
  private readonly sqliteDirectoryPath: string;
  private masterDb: Database;
  
  constructor(private readonly configService: ConfigService) {
    this.dbDirectoryPath     = this.configService.get('dbDirectoryPath');
    this.sqliteDirectoryPath = this.configService.get('sqliteDirectoryPath');
    (async () => {
      await fs.mkdir(this.dbDirectoryPath    , { recursive: true });
      await fs.mkdir(this.sqliteDirectoryPath, { recursive: true });
      this.masterDb = new Database(path.resolve(this.dbDirectoryPath, 'master-db.sqlite3'));
      await util.promisify(this.masterDb.run).call(this.masterDb, `
        CREATE TABLE IF NOT EXISTS databases (
          db_name        TEXT  NOT NULL  PRIMARY KEY,
          db_credential  TEXT  NOT NULL
        )
      `);
    })();
  }
  
  /** DB 名一覧を返す */
  public async listDbNames(): Promise<Array<string>> {
    const results = await util.promisify(this.masterDb.all).call(this.masterDb, `SELECT db_name FROM databases`);
    return results;
  }
  
  /** DB ファイルを作成する */
  public async createDb(dbName: string, dbCredential: string): Promise<void> {
    const db = this.createOrOpenDb(dbName);
    await util.promisify(db.close).call(db);
    await util.promisify(this.masterDb.run).call(this.masterDb, `INSERT INTO databases (db_name, db_credential) VALUES (?, ?)`, [dbName, dbCredential]);
  }
  
  /** DB ファイルを削除する */
  public async deleteDb(dbName: string, dbCredential: string): Promise<void> {
    await util.promisify(this.masterDb.run).call(this.masterDb, `DELETE FROM databases WHERE db_name = ? AND db_credential = ?`, [dbName, dbCredential]);
    await fs.unlink(path.resolve(this.sqliteDirectoryPath, `${dbName}.sqlite3`));  // ファイルが存在しない場合はエラーになる
  }
  
  /** SQL を実行する・INSERT・UPDATE・DELETE 時の結果を返す */
  public async run(dbName: string, sql: string, params: Array<any> | any): Promise<any> {
    const db = this.createOrOpenDb(dbName);
    const result = await new Promise((resolve, reject) => {
      db.run(sql, params, function(error) {
        if(error) reject(error);
        resolve(this);  // lastID, changes
      });
    });
    await util.promisify(db.close).call(db);
    return result;
  }
  
  /** SQL を実行し SELECT 結果を1件返す */
  public async get(dbName: string, sql: string, params: Array<any> | any): Promise<any> {
    const db = this.createOrOpenDb(dbName);
    const result = await util.promisify(db.get.bind(db, sql, params)).call(db);
    await util.promisify(db.close).call(db);
    return result;
  }
  
  /** SQL を実行し SELECT 結果を全件返す */
  public async all(dbName: string, sql: string, params: Array<any> | any): Promise<any> {
    const db = this.createOrOpenDb(dbName);
    const results = await util.promisify(db.all.bind(db, sql, params)).call(db);
    await util.promisify(db.close).call(db);
    return results;
  }
  
  /** 指定の DB 名がマスター DB に定義されているか否か */
  public async existsDbName(dbName: string): Promise<boolean> {
    const result = await util.promisify(this.masterDb.get).call(this.masterDb, `SELECT db_name FROM databases WHERE db_name = ?`, [dbName]);
    return result != null;
  }
  
  /** DB 名と DB クレデンシャルが一致する DB がマスター DB に定義されているか否か */
  public async existsDb(dbName: string, dbCredential: string): Promise<boolean> {
    const result = await util.promisify(this.masterDb.get).call(this.masterDb, `SELECT db_name FROM databases WHERE db_name = ? AND db_credential = ?`, [dbName, dbCredential]);
    return result != null;
  }
  
  /** DB を読み込む・存在しない場合は作成する */
  private createOrOpenDb(dbName: string): Database {
    return new Database(path.resolve(this.sqliteDirectoryPath, `${dbName}.sqlite3`));
  }
}
