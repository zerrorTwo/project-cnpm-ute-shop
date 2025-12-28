import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
// import { DashboardService } from './dashboard.service';
import { ProductService } from '../../services/product.service';
import { BillService } from '../../services/bill.service';
// import { ReportService } from '../report/report.service';
import { DashBoardDateDto } from '../../dtos/request/dashBoardDateDto.dto';
import { Public } from 'src/utils/auth/public.decorator';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { SuccessResponse } from 'src/dtos/response.dto';
import { Builder } from 'builder-pattern';
import { EBillStatus } from 'src/entities/bill.entity';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('dashboard')
// @UseGuards(RolesGuard)
// @Roles('ADMIN')
@Public()
export class DashboardController {
  constructor(
    private readonly productService: ProductService,
    private readonly billService: BillService,
    // private readonly reportService: ReportService,
  ) {}

  // ================= CHART CARD =================
  @Get('chartCard')
  async getChartCardData() {
    const data = {
      quantityProduct: await this.productService.getQuantityOfProduct(),
      quantityBillNeedToProcess:
        (await this.billService.countBillsByStatus(EBillStatus.PENDING)) +
        (await this.billService.countBillsByStatus(EBillStatus.CONFIRMED)),
      totalProfit: await this.billService.totalProfit(EBillStatus.COMPLETED),
      totalRevenue: await this.billService.totalRevenue(EBillStatus.COMPLETED),
    };
    return Builder<SuccessResponse>()
      .data(data)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  // ================= REVENUE BY TIME =================
  @Post('revenueByTime')
  async getRevenueByTime(@Body() dto: DashBoardDateDto) {
    const result = await this.billService.getRevenueOrProfitByTime(
      dto.startDate,
      dto.endDate,
      EBillStatus.COMPLETED,
      0,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  // ================= PROFIT BY TIME =================
  @Post('profitByTime')
  async getProfitByTime(@Body() dto: DashBoardDateDto) {
    const result = await this.billService.getRevenueOrProfitByTime(
      dto.startDate,
      dto.endDate,
      EBillStatus.COMPLETED,
      1,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  // ================= PRODUCT OUT OF STOCK =================
  // @Get('productOutOfStock')
  // async getProductOutOfStock() {
  //   const result = await this.productService.getProductOutOfStock();
  //   return Builder<SuccessResponse>()
  //     .data(result)
  //     .message(SuccessMessages.GET_SUCCESSFULLY)
  //     .status(HttpStatusCode.Ok)
  //     .build();
  // }

  // ================= BEST SELLING PRODUCT =================
  @Post('productBestSelling')
  async getProductBestSelling(@Body() dto: DashBoardDateDto) {
    const result = await this.billService.getProductBestSellingByTime(
      dto.startDate,
      dto.endDate,
      EBillStatus.COMPLETED,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post('newUserByTime')
  async getNewUserByTime(@Body() dto: DashBoardDateDto) {
    const result = await this.billService.getNewUserByTime(
      dto.startDate,
      dto.endDate,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
  // ================= EXPORT EXCEL =================
  // @Get('report/excel')
  // async exportExcel(@Res() res: Response) {
  //   const buffer = await this.reportService.exportDashBoardOfMonth();

  //   res.set({
  //     'Content-Disposition': 'attachment; filename=BaoCaoKinhDoanh.xlsx',
  //     'Content-Type': 'application/octet-stream',
  //   });

  //   res.status(HttpStatus.OK).send(buffer);
  // }
}
