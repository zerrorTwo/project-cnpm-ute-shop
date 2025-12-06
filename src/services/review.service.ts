import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepository } from '../repositories/comment.repository';
import { VoucherRepository } from '../repositories/voucher.repository';
import { LoyaltyPointRepository } from '../repositories/loyalty-point.repository';
import { BillRepository } from '../repositories/bill.repository';
import { UserRepository } from '../repositories/user.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CreateReviewDto, ReviewResponseDto } from '../dtos/review.dto';
import { EVoucherType, EVoucherStatus } from '../entities/voucher.entity';
import { EPointTransactionType } from '../entities/loyalty-point.entity';
import { EBillStatus } from '../entities/bill.entity';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  // Cấu hình phần thưởng
  private readonly REVIEW_REWARD_POINTS = 50; // 50 điểm cho mỗi đánh giá
  private readonly VOUCHER_VALUE = 10; // Giảm 10%
  private readonly VOUCHER_MAX_DISCOUNT = 50000; // Giảm tối đa 50k
  private readonly VOUCHER_MIN_ORDER = 200000; // Đơn tối thiểu 200k
  private readonly VOUCHER_EXPIRY_DAYS = 30; // Voucher hết hạn sau 30 ngày

  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly voucherRepository: VoucherRepository,
    private readonly loyaltyPointRepository: LoyaltyPointRepository,
    private readonly billRepository: BillRepository,
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async createReview(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const { productId, billId, rating, description } = createReviewDto;

    this.logger.log(
      `User ${userId} creating review for product ${productId} from bill ${billId}`,
    );

    // Kiểm tra bill có tồn tại và thuộc về user
    const bill = await this.billRepository.findOne({
      where: { id: billId },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!bill) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (bill.customer.id !== userId) {
      throw new BadRequestException('Bạn không có quyền đánh giá đơn hàng này');
    }

    // Chỉ cho phép đánh giá đơn đã thanh toán
    if (bill.status !== EBillStatus.PAID) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá sản phẩm từ đơn hàng đã thanh toán',
      );
    }

    // Kiểm tra sản phẩm có trong đơn hàng không
    const productInBill = bill.items.find(
      (item) => item.product.id === productId,
    );

    if (!productInBill) {
      throw new BadRequestException('Sản phẩm không có trong đơn hàng này');
    }

    // Kiểm tra đã đánh giá chưa
    const hasReviewed = await this.commentRepository.hasUserReviewedProduct(
      userId,
      productId,
      billId,
    );

    if (hasReviewed) {
      throw new BadRequestException(
        'Bạn đã đánh giá sản phẩm này từ đơn hàng này rồi',
      );
    }

    // Tạo review
    const review = await this.commentRepository.save({
      customer: { id: userId } as any,
      product: { id: productId } as any,
      bill: { id: billId } as any,
      rating,
      description,
      active: true,
      hasRewardGiven: true,
    });

    this.logger.log(`Review created with ID: ${review.id}`);

    // Cập nhật ratingAvg của product
    await this.updateProductRating(productId);

    // Quyết định tặng voucher hay điểm (random hoặc theo logic)
    const rewardType = Math.random() > 0.5 ? 'voucher' : 'points';
    let reward: any = {};

    if (rewardType === 'voucher') {
      // Tạo voucher
      const voucher = await this.createVoucher(userId);
      reward = {
        voucherCode: voucher.code,
        voucherValue: voucher.value,
        voucherExpiry: voucher.expiryDate,
      };
      this.logger.log(`Voucher ${voucher.code} created for user ${userId}`);
    } else {
      // Tặng điểm
      const points = await this.addLoyaltyPoints(
        userId,
        this.REVIEW_REWARD_POINTS,
      );
      reward = { points: this.REVIEW_REWARD_POINTS };
      this.logger.log(
        `${this.REVIEW_REWARD_POINTS} points added to user ${userId}`,
      );
    }

    return {
      reviewId: review.id,
      productId,
      rating,
      description,
      rewardType,
      reward,
    };
  }

  private async createVoucher(userId: number) {
    const code = this.generateVoucherCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.VOUCHER_EXPIRY_DAYS);

    return await this.voucherRepository.save({
      code,
      type: EVoucherType.PERCENTAGE,
      value: this.VOUCHER_VALUE,
      maxDiscount: this.VOUCHER_MAX_DISCOUNT,
      minOrderValue: this.VOUCHER_MIN_ORDER,
      status: EVoucherStatus.ACTIVE,
      expiryDate,
      description: `Voucher giảm ${this.VOUCHER_VALUE}% (tối đa ${this.VOUCHER_MAX_DISCOUNT.toLocaleString()}đ) cho đơn hàng từ ${this.VOUCHER_MIN_ORDER.toLocaleString()}đ - Tặng khi đánh giá sản phẩm`,
      user: { id: userId } as any,
    });
  }

  private async addLoyaltyPoints(userId: number, points: number) {
    // Tạo transaction tích điểm
    await this.loyaltyPointRepository.save({
      user: { id: userId } as any,
      points,
      transactionType: EPointTransactionType.EARN,
      description: `Tích điểm khi đánh giá sản phẩm`,
    });

    // Cập nhật tổng điểm của user
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.totalLoyaltyPoints += points;
      await this.userRepository.update(userId, {
        totalLoyaltyPoints: user.totalLoyaltyPoints,
      });
    }

    return points;
  }

  private generateVoucherCode(): string {
    const prefix = 'REVIEW';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${random}${timestamp}`;
  }

  async getProductReviews(productId: number) {
    const reviews = await this.commentRepository.findByProductId(productId);

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      description: review.description,
      customerName: review.customer.fullName || 'Anonymous',
      createdAt: review.createdAt,
    }));
  }

  async getUserVouchers(userId: number) {
    return await this.voucherRepository.findActiveByUserId(userId);
  }

  async getUserLoyaltyPoints(userId: number) {
    const user = await this.userRepository.findById(userId);
    const history =
      await this.loyaltyPointRepository.getPointHistoryByUserId(userId);

    return {
      totalPoints: user?.totalLoyaltyPoints || 0,
      history: history.map((h) => ({
        points: h.points,
        type: h.transactionType,
        description: h.description,
        createdAt: h.createdAt,
      })),
    };
  }

  private async updateProductRating(productId: number) {
    const reviews = await this.commentRepository.find({
      where: { product: { id: productId }, active: true },
    });

    if (reviews.length === 0) {
      return;
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    const product = await this.productRepository.repository.findOne({
      where: { id: productId },
    });

    if (product) {
      product.ratingAvg = Math.round(avgRating * 10) / 10; //làm tròn 1 chữ số thập phân
      await this.productRepository.repository.save(product);
      this.logger.log(
        `Product ${productId} rating updated to ${product.ratingAvg}`,
      );
    }
  }
}
