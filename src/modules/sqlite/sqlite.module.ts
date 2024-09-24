import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { SqliteController } from './sqlite.controller';
import { SqliteService } from './sqlite.service';

@Module({
  imports: [
    SharedModule
  ],
  controllers: [
    SqliteController
  ],
  providers: [
    SqliteService
  ]
})
export class SqliteModule { }
