import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ENotificationType } from '../entities/notification.entity';

export class CreateNotificationEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ENotificationType)
  type: ENotificationType;

  @IsOptional()
  @IsNumber()
  recipientId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  recipientIds?: number[];

  @IsOptional()
  @IsBoolean()
  sendToAll?: boolean;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
