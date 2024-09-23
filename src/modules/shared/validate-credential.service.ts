import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ValidateCredentialService {
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
}
