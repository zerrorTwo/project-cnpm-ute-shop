import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { VoucherService } from 'src/services/voucher.service';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  VoucherFilterDto,
} from 'src/dtos/voucher.dto';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import { EVoucherStatus } from 'src/entities/voucher.entity';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  async createVoucher(@Body() createVoucherDto: CreateVoucherDto) {
    const voucher = await this.voucherService.createVoucher(createVoucherDto);

    return Builder<SuccessResponse>()
      .data({ voucher })
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Created)
      .build();
  }

  @Get()
  async getAllVouchers(@Query() filterDto: VoucherFilterDto) {
    const result = await this.voucherService.getAllVouchers(filterDto);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Get('statistics')
  async getStatistics() {
    const statistics = await this.voucherService.getVoucherStatistics();

    return Builder<SuccessResponse>()
      .data({ statistics })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Get(':id')
  async getVoucherById(@Param('id', ParseIntPipe) id: number) {
    const voucher = await this.voucherService.getVoucherById(id);

    return Builder<SuccessResponse>()
      .data({ voucher })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Put(':id')
  async updateVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    updateVoucherDto.id = id;
    const voucher = await this.voucherService.updateVoucher(updateVoucherDto);

    return Builder<SuccessResponse>()
      .data({ voucher })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Delete(':id')
  async deleteVoucher(@Param('id', ParseIntPipe) id: number) {
    await this.voucherService.deleteVoucher(id);

    return Builder<SuccessResponse>()
      .data(null)
      .message(SuccessMessages.DELETE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Patch(':id/status')
  async updateVoucherStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: EVoucherStatus,
  ) {
    const voucher = await this.voucherService.updateVoucherStatus(id, status);

    return Builder<SuccessResponse>()
      .data({ voucher })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post('update-expired')
  async updateExpiredVouchers() {
    await this.voucherService.updateExpiredVouchers();

    return Builder<SuccessResponse>()
      .data(null)
      .message('Cập nhật voucher hết hạn thành công')
      .status(HttpStatusCode.Ok)
      .build();
  }
}
