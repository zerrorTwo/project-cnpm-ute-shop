import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  Param,
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
  @ApiOperation({
    summary:
      'Lấy danh sách đơn hàng của người dùng (có phân trang và tìm kiếm)',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'PAID', 'CANCELLED'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên sản phẩm hoặc mã đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy đơn hàng thành công',
    type: SuccessResponse,
  })
  async getOrders(
    @CurrentUser('id') userId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.billService.getOrdersByUserId(
      userId,
      +page,
      +limit,
      status,
      search,
    );

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      message: SuccessMessages.GET_SUCCESSFULLY,
      status: 200,
    };
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
  @Post(':billId/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Hủy đơn hàng thành công',
    type: SuccessResponse,
  })
  async cancelOrder(
    @CurrentUser('id') userId: number,
    @Param('billId') billId: string,
  ) {
    const result = await this.billService.cancelOrder(+billId, userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(result.message)
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

  @UseGuards(AuthGuard)
  @Post(':billCode/recreate-payment')
  @ApiOperation({ summary: 'Tạo lại link thanh toán cho đơn hàng' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Tạo lại link thanh toán thành công',
    type: SuccessResponse,
  })
  async recreatePaymentUrl(
    @CurrentUser('id') userId: number,
    @Param('billCode') billCode: string,
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await this.billService.recreatePaymentUrl(
      billCode,
      userId,
      ipAddr as string,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(result.message)
      .status(200)
      .build();
  }
}
