import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BillService } from '../../services/bill.service';
import { UpdateBillStatusDto } from '../../dtos/request/update-bill-status.dto';
import { EBillStatus } from '../../entities/bill.entity';
import { AuthGuard } from '../../utils/auth/auth.guard';

@Controller('/bills')
@UseGuards(AuthGuard)
export class AdminBillController {
  constructor(private readonly billService: BillService) {}

  @Get()
  async getAllBills(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: EBillStatus,
  ) {
    return this.billService.getAllBills(page, limit, search, status);
  }

  @Get(':id')
  async getBillDetail(@Param('id', ParseIntPipe) id: number) {
    return this.billService.getBillDetail(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBillStatusDto,
  ) {
    return this.billService.updateBillStatus(id, updateDto);
  }
}
