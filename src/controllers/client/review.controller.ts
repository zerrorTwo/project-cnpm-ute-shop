import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import { CreateReviewDto } from '../../dtos/review.dto';
import { ReviewService } from '../../services/review.service';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Đánh giá sản phẩm đã mua (tặng voucher hoặc điểm tích lũy)',
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Đánh giá thành công và nhận phần thưởng',
    type: SuccessResponse,
  })
  async createReview(
    @CurrentUser('id') userId: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const result = await this.reviewService.createReview(
      userId,
      createReviewDto,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(
        `Cảm ơn bạn đã đánh giá! Bạn nhận được ${
          result.rewardType === 'voucher'
            ? `voucher ${result.reward.voucherCode}`
            : `${result.reward.points} điểm tích lũy`
        }`,
      )
      .status(201)
      .build();
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của sản phẩm' })
  @ApiParam({ name: 'productId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đánh giá thành công',
    type: SuccessResponse,
  })
  async getProductReviews(@Param('productId') productId: string) {
    const result = await this.reviewService.getProductReviews(+productId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('my-vouchers')
  @ApiOperation({ summary: 'Lấy danh sách voucher của người dùng' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách voucher thành công',
    type: SuccessResponse,
  })
  async getUserVouchers(@CurrentUser('id') userId: number) {
    const result = await this.reviewService.getUserVouchers(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('my-points')
  @ApiOperation({ summary: 'Lấy điểm tích lũy và lịch sử giao dịch' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy điểm tích lũy thành công',
    type: SuccessResponse,
  })
  async getUserLoyaltyPoints(@CurrentUser('id') userId: number) {
    const result = await this.reviewService.getUserLoyaltyPoints(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('my-reviews')
  @ApiOperation({ summary: 'Lấy danh sách reviews của user (để filter sản phẩm đã đánh giá)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách reviews thành công',
    type: SuccessResponse,
  })
  async getUserReviews(@CurrentUser('id') userId: number) {
    const result = await this.reviewService.getUserReviews(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }
}
