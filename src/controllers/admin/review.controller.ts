import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import { ReviewService } from '../../services/review.service';
import { AuthGuard } from '../../utils/auth/auth.guard';

@ApiTags('Admin - Reviews')
@Controller('reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả reviews (Admin)',
    description: 'Admin có thể xem tất cả reviews với filter và pagination',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'rating', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'hasRewardGiven', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách reviews thành công',
    type: SuccessResponse,
  })
  async getAllReviews(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('rating', new ParseIntPipe({ optional: true })) rating?: number,
    @Query('hasRewardGiven') hasRewardGiven?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.reviewService.getAllReviews({
      page: page || 1,
      limit: limit || 10,
      rating,
      hasRewardGiven:
        hasRewardGiven === 'true'
          ? true
          : hasRewardGiven === 'false'
            ? false
            : undefined,
      search,
    });
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa review (Admin)',
    description: 'Admin có thể xóa bất kỳ review nào',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Xóa review thành công',
  })
  async deleteReview(@Param('id', ParseIntPipe) id: number) {
    const result = await this.reviewService.adminDeleteReview(id);
    return Builder<SuccessResponse>()
      .data(result)
      .message('Xóa review thành công')
      .status(200)
      .build();
  }
}
