import { IsArray, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DiscountDetailDto {
  @ApiProperty({ description: 'ID of the detail', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Discount percentage', example: 10.5 })
  @IsNumber()
  percentage: number;

  @ApiProperty({
    description: 'Start Date',
    example: '2023-12-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({
    description: 'End Date',
    example: '2023-12-31T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty({ description: 'List of Product IDs', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  productID: number[];
}
