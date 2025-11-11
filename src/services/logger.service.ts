import {
  Injectable,
  LoggerService as NestLoggerService,
  LogLevel,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const fileRotateTransport = new winston.transports.DailyRotateFile({
      dirname: logsDir,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? 'debug'
          : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    this.logger = winston.createLogger({
      level:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? 'debug'
          : 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'ute-shop-be' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        fileRotateTransport,
      ],
    });
  }

  log(message: any, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string): void {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context });
  }

  setLogLevels(levels: LogLevel[]) {}

  logSystem(level: string, message: any, meta?: any) {
    if (level === 'error') {
      this.error(message, meta?.stack, meta?.context);
    } else if (level === 'warn') {
      this.warn(message, meta?.context);
    } else if (level === 'debug') {
      this.debug(message, meta?.context);
    } else if (level === 'verbose') {
      this.verbose(message, meta?.context);
    } else {
      this.log(message, meta?.context);
    }
  }
}
