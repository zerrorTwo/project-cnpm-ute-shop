import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EPaymentMethod } from '../entities/bill.entity';

export class CheckoutDto {
  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: EPaymentMethod,
    example: EPaymentMethod.CASH,
  })
  @IsEnum(EPaymentMethod)
  paymentMethod: EPaymentMethod;

  @ApiProperty({
    description: 'Tên người nhận hàng',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiProperty({
    description: 'Số điện thoại người nhận',
    example: '0912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    example: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng buổi sáng',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Địa chỉ IP của khách hàng',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddr?: string;
}
