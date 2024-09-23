import { Module } from '@nestjs/common';

import { ValidateCredentialService } from './validate-credential.service';

@Module({
  providers: [
    ValidateCredentialService
  ],
  exports: [
    ValidateCredentialService
  ]
})
export class SharedModule { }
