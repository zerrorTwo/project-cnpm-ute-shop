import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VoucherService } from 'src/services/voucher.service';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Client - Voucher')
@Controller('vouchers')
export class ClientVoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  async getValidVouchers() {
    const vouchers = await this.voucherService.getValidVouchersForClient();
    return Builder<SuccessResponse>()
      .data({ vouchers })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post('apply')
  async applyVoucher(
    @Body('code') code: string,
    @Body('orderValue') orderValue: number,
  ) {
    const result = await this.voucherService.applyVoucher(code, orderValue);
    return Builder<SuccessResponse>()
      .data(result)
      .message('Áp dụng voucher thành công')
      .status(HttpStatusCode.Ok)
      .build();
  }
}
