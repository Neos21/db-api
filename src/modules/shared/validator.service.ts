import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ValidatorService {
  private readonly credential: string;
  
  constructor(private readonly configService: ConfigService) {
    this.credential = this.configService.get('credential');
  }
  
  /** クレデンシャルが空値でなく一致すれば OK */
  public validateCredential(inputCredential: string): boolean {
    return !this.isEmpty(inputCredential) && this.credential === inputCredential;
  }
  
  /** 引数が空値であるか否か */
  public isEmpty(value: string): boolean {
    return value == null || String(value).trim() === '';
  }
  
  /** DB 名と DB クレデンシャルの値が正常か否か・不正な場合はエラーメッセージを返す */
  public validateDbInput(dbName: string, dbCredential: string): string | null {
    if(this.isEmpty(dbName)      ) return 'DB Name Is Empty';
    if(this.isEmpty(dbCredential)) return 'DB Credential Is Empty';
    if(dbName.length       > 50  ) return 'DB Name Is Too Long';
    if(dbCredential.length <  8  ) return 'DB Credential Is Too Short. Please Input 8 Characters Or More';
    if(dbCredential.length > 20  ) return 'DB Credential Is Too Long. Please Input 20 Characters Or Less';
    if(!(/^[a-z]+[a-z-]*[^-]$/u).test(dbName)) return 'Invalid DB Name Pattern';  // 半角小文字・ハイフンケースのみ許容する
    return null;
  }
  
  /** 引数が連想配列か否か・Array や Function も除く */
  public isObject(item: any): boolean {
    return item != null && item?.constructor?.name === 'Object';
  }
}
