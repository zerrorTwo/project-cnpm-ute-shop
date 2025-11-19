import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import { BillService } from '../../services/bill.service';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';

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
}
