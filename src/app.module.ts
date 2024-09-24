import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration } from './core/configs/configuration';
import { SharedModule } from './modules/shared/shared.module';
import { JsonDbModule } from './modules/json-db/json-db.module';
import { SqliteModule } from './modules/sqlite/sqlite.module';
import { AppController } from './app.controller';
import { AccessLogMiddleware } from './core/middlewares/access-log.middleware';

@Module({
  imports: [
    // 環境変数を注入する
    ConfigModule.forRoot({
      isGlobal: true,  // 各 Module での `imports` を不要にする
      load: [configuration]  // 環境変数を読み取り適宜デフォルト値を割り当てるオブジェクトをロードする
    }),
    SharedModule,
    JsonDbModule,
    SqliteModule
  ],
  controllers: [
    AppController
  ]
})
export class AppModule {
  /** 独自のアクセスログ出力ミドルウェアを適用する */
  public configure(middlewareConsumer: MiddlewareConsumer): void {
    middlewareConsumer.apply(AccessLogMiddleware).forRoutes('*');
  }
}
