import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountDetailDto } from './discount-detail.dto';

export class DiscountCampaignDto {
  @ApiProperty({
    description: 'ID of the campaign',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Name of campaign', example: 'Black Friday' })
  @IsNotEmpty({ message: 'description must be not blank' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Percentage of discount', example: 20 })
  @IsNotEmpty({ message: 'percentage must be not blank' })
  @IsNumber()
  percentage: number;

  @ApiProperty({ description: 'Description', example: 'Super sale' })
  @IsNotEmpty({ message: 'description must be not blank' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Is active', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2023-10-25',
  })
  @IsNotEmpty({ message: 'Start date cannot be null' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', example: '2023-10-30' })
  @IsNotEmpty({ message: 'End date cannot be null' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'List of Product IDs', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  productIDs: number[];
}
