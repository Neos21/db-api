import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';

import { cyan, yellow } from './core/utils/colour-logger';
import { listRoutes } from './core/utils/list-routes';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // JSON を解釈できるようにする
  app.use(express.json());
  // CORS を有効にする
  app.enableCors({
    origin: (/localhost/u),  // `localhost` を全て許可するため正規表現を使う
    methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers, Access-Control-Allow-Credentials',
    credentials: true  // `Access-Control-Allow-Credentials` を許可する
  });
  
  // Swagger を生成する
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DB API')
    .setVersion('0.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('', app, swaggerDocument, {
    jsonDocumentUrl: 'swagger/json',
    yamlDocumentUrl: 'swagger/yaml'
  });
  // Swagger JSON を書き出す (GitHub Pages 用・`./docs/index.html` は Swagger UI のモノを利用)
  await fs.mkdir(path.resolve(__dirname, '../docs'), { recursive: true });
  await fs.writeFile(path.resolve(__dirname, '../docs/swagger.json'), JSON.stringify(swaggerDocument), 'utf-8');
  
  // サーバを起動する
  const port = app.get<ConfigService>(ConfigService).get<number>('port')!;
  await app.listen(port);
  
  const logger = new Logger(bootstrap.name);
  logger.log(cyan(`Server Started At Port [`) + yellow(`${port}`) + cyan(']'));
  
  // ルーティング一覧を出力する
  logger.log(listRoutes(app.getHttpServer()._events.request._router));
}
void bootstrap();
