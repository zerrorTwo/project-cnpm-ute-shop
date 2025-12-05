import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';
import type { Request } from 'express';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import { CheckoutDto } from '../../dtos/checkout.dto';
import { BillService } from '../../services/bill.service';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';
import { Public } from '../../utils/auth/public.decorator';

@ApiTags('Bills')
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @UseGuards(AuthGuard)
  @Get('orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy đơn hàng thành công',
    type: SuccessResponse,
  })
  async getOrders(@CurrentUser('id') userId: number) {
    const result = await this.billService.getOrdersByUserId(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('checkout')
  @ApiOperation({ summary: 'Lấy thông tin checkout (cart + tính toán giá)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin checkout thành công',
    type: SuccessResponse,
  })
  async getCheckoutInfo(@CurrentUser('id') userId: number) {
    const result = await this.billService.getCheckoutInfo(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng' })
  @ApiBearerAuth()
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Đặt hàng thành công',
    type: SuccessResponse,
  })
  async checkout(
    @CurrentUser('id') userId: number,
    @Body() checkoutData: CheckoutDto,
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    checkoutData.ipAddr = ipAddr as string;

    const result = await this.billService.checkout(userId, checkoutData);
    return Builder<SuccessResponse>()
      .data(result)
      .message('Đặt hàng thành công')
      .status(201)
      .build();
  }

  @Public()
  @Get('payment/vnpay-return')
  @ApiOperation({ summary: 'Xử lý callback từ VNPay sau khi thanh toán' })
  @ApiQuery({
    name: 'vnp_TxnRef',
    required: true,
    description: 'Mã giao dịch VNPay',
  })
  @ApiQuery({
    name: 'vnp_ResponseCode',
    required: true,
    description: 'Mã phản hồi từ VNPay',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback VNPay thành công',
    type: SuccessResponse,
  })
  async vnpayReturn(@Query() query: any) {
    const result = await this.billService.handleVNPayReturn(query);
    return Builder<SuccessResponse>()
      .data(result)
      .message(result.message)
      .status(200)
      .build();
  }
}
