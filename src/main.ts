import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
const compression = require('compression');
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ValidationPipe } from './filters/validation-pipe.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  let appOptions = {};

  const app = await NestFactory.create(AppModule, appOptions);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(compression());
  app.use(cookieParser());

  app.use(json({ limit: '50mb' }));

  app.setGlobalPrefix('ute-shop/api');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
