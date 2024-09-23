import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { JsonDbController } from './json-db.controller';
import { JsonDbService } from './json-db.service';

@Module({
  imports: [
    SharedModule
  ],
  controllers: [
    JsonDbController
  ],
  providers: [
    JsonDbService
  ]
})
export class JsonDbModule { }
