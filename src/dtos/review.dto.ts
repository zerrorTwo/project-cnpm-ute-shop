import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID sản phẩm', example: 1 })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'ID đơn hàng', example: 1 })
  @IsInt()
  @IsNotEmpty()
  billId: number;

  @ApiProperty({ description: 'Đánh giá', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Nội dung đánh giá', example: 'Sản phẩm tốt' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  reviewId: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  rewardType: 'voucher' | 'points';

  @ApiProperty()
  reward: {
    voucherCode?: string;
    voucherValue?: number;
    voucherExpiry?: Date;
    points?: number;
  };
}
