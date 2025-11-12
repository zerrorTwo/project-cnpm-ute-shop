import compression from 'compression';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import initSwagger from './utils/configs/innit-swagger';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ValidationPipe } from './filters/validation-pipe.filter';
import { LoggerService } from './services/logger.service';

async function bootstrap() {
  const enableLogging = process.env.ENABLE_LOGGING === 'true' || true;
  let appOptions = {};

  if (enableLogging) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const customLogger = new LoggerService(new ConfigService());
    appOptions = { logger: customLogger };
  }

  const app = await NestFactory.create(AppModule, appOptions);

  const configService = app.get(ConfigService);

  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  app.use(compression());
  app.use(cookieParser());

  // Configure body parser for large requests
  app.use(json({ limit: '50mb' }));

  app.setGlobalPrefix('ute-shop/api');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  initSwagger(app);

  const port = configService.get<number>('PORT') || 3009;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server running port =====> ${port}`);
}
bootstrap();
