import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID sản phẩm', example: 1 })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Nội dung comment', example: 'Sản phẩm rất tốt!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'ID comment cha (nếu là reply)',
    example: null,
    required: false,
  })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({
    description: 'ID đơn hàng (nếu comment từ đơn hàng đã mua)',
    example: null,
    required: false,
  })
  @IsInt()
  @IsOptional()
  billId?: number;
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Nội dung comment mới', example: 'Đã cập nhật nội dung' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  customer: {
    id: number;
    fullName: string;
    email: string;
    avatar?: string;
  };

  @ApiProperty({ required: false })
  replies?: CommentResponseDto[];

  @ApiProperty({ required: false })
  parentId?: number;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  comments: CommentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
