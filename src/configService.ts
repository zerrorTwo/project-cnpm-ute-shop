import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDatabaseInfo(): string {
    const host = this.configService.get<string>('DB_HOST');
    const dbName = this.configService.get<string>('DB_NAME');
    return `DB Host: ${host}, Database: ${dbName}`;
  }
}
