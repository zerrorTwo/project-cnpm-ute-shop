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
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Client - Voucher')
@Controller('vouchers')
@UseGuards(AuthGuard)
export class ClientVoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  async getValidVouchers(@Req() req: any) {
    const userId = req.user?.id;
    const vouchers =
      await this.voucherService.getValidVouchersForClient(userId);
    return Builder<SuccessResponse>()
      .data({ vouchers })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post('apply')
  async applyVoucher(
    @Req() req: any,
    @Body('code') code: string,
    @Body('orderValue') orderValue: number,
  ) {
    const userId = req.user?.id;
    const result = await this.voucherService.applyVoucher(
      code,
      orderValue,
      userId,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message('Áp dụng voucher thành công')
      .status(HttpStatusCode.Ok)
      .build();
  }
}
