import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { BillRepository } from '../repositories/bill.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { Bill, EBillStatus, EPaymentMethod } from '../entities/bill.entity';
import {
  Payment,
  EPaymentStatus,
  EPaymentCurrency,
} from '../entities/payment.entity';
import { LineItem } from '../entities/line-item.entity';
import { CheckoutDto } from '../dtos/checkout.dto';
import { OrderDto } from '../dtos/bill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VNPayService } from './vnpay.service';
import { ProductCode } from 'vnpay';
import { LineItemRepository } from 'src/repositories/line-item.repository';
import { DashBoardResponseDto } from 'src/dtos/response/DashBoardResponseDto';
import { ProductBestSellingDto } from 'src/dtos/request/ProductBestSellingDto';
import { User } from 'src/entities';
import { UserRepository } from 'src/repositories/user.repository';
import { NotificationService } from './notification.service';
import { ENotificationType } from 'src/entities/notification.entity';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  constructor(
    private readonly billRepository: BillRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
    @InjectRepository(LineItem)
    private readonly lineItemRepository: Repository<LineItem>,

    private readonly lineItemRepository2: LineItemRepository,
    @Optional() private readonly vnpayService?: VNPayService,
    private readonly notificationService?: NotificationService,
  ) {}

  async getOrdersByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) {
    const bills = await this.billRepository.findByUserIdWithPagination(
      userId,
      page,
      limit,
      status,
      search,
    );

    const ordersWithReviews = await Promise.all(
      bills.data.map(async (bill) => {
        const itemsWithReviewStatus = await Promise.all(
          bill.items.map(async (item) => {
            const isReviewed =
              await this.commentRepository.hasUserReviewedProduct(
                userId,
                item.product.id,
                bill.id,
              );

            return {
              id: item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              isReviewed,
              product: {
                id: item.product.id,
                productName: item.product.productName,
                slug: item.product.slug,
                images: item.product.images?.map((img) => img.url) || [],
              },
            };
          }),
        );

        return {
          id: bill.id,
          total: bill.total,
          discount: bill.discount,
          paymentMethod: bill.paymentMethod,
          paymentStatus: bill.payment?.paymentStatus,
          status: bill.status,
          billCode: bill.billCode,
          orderId: bill.orderId,
          receiverName: bill.receiverName,
          receiverPhone: bill.receiverPhone,
          shippingAddress: bill.shippingAddress,
          note: bill.note,
          createdAt: bill.createdAt,
          items: itemsWithReviewStatus,
        };
      }),
    );

    return {
      data: ordersWithReviews,
      total: bills.total,
      page,
      limit,
      totalPages: Math.ceil(bills.total / limit),
    };
  }

  async getCheckoutInfo(userId: number) {
    this.logger.log(`Get checkout info for user: ${userId}`);
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }
    let subtotal = 0;
    const items = cart.cartItems.map((item) => {
      const basePrice = item.product.unitPrice;
      const discount = item.product.discountCampaign?.percentage || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.product.id,
        productName: item.product.productName,
        quantity: item.quantity,
        unitPrice: finalPrice,
        itemTotal,
        image: item.product.images?.[0]?.url || null,
      };
    });

    const shipping = 0;
    const tax = subtotal * 0.1; // VAT 10%
    const total = subtotal + shipping + tax;

    return {
      userId,
      items,
      subtotal,
      shipping,
      tax,
      discount: 0,
      total,
    };
  }

  async checkout(userId: number, checkoutData: CheckoutDto) {
    this.logger.log(`Checkout for user: ${userId}`);
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // Kiểm tra tồn kho cho tất cả sản phẩm
    for (const item of cart.cartItems) {
      if (item.product.quantityStock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${item.product.productName}" không đủ hàng. Chỉ còn ${item.product.quantityStock} sản phẩm.`,
        );
      }
    }
    let subtotal = 0;
    const lineItems: Partial<LineItem>[] = [];

    for (const item of cart.cartItems) {
      const basePrice = item.product.unitPrice;
      const discount = item.product.discountCampaign?.percentage || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;

      lineItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: finalPrice,
      });
    }

    const shipping = 0;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    const billCode = Date.now();
    const orderId = Math.floor(Math.random() * 1000000);

    let billStatus: EBillStatus;
    let paymentUrl: string | null = null;

    switch (checkoutData.paymentMethod) {
      case EPaymentMethod.CASH:
        billStatus = EBillStatus.PENDING;
        this.logger.log(`COD payment - Order will be PENDING until delivery`);
        break;

      case EPaymentMethod.CARD:
      case EPaymentMethod.BANKING:
        billStatus = EBillStatus.PENDING;
        this.logger.log(
          `VNPay payment (${checkoutData.paymentMethod}) - Creating payment URL`,
        );
        break;

      default:
        billStatus = EBillStatus.PENDING;
    }

    const payment = await this.paymentRepository.save({
      paymentStatus: EPaymentStatus.PENDING,
      currency: EPaymentCurrency.VND,
      paymentMethod: checkoutData.paymentMethod as any,
    });

    const bill = await this.billRepository.create({
      customer: { id: userId } as any,
      total,
      discount: 0,
      paymentMethod: checkoutData.paymentMethod,
      status: billStatus,
      billCode,
      orderId,
      receiverName: checkoutData.receiverName,
      receiverPhone: checkoutData.receiverPhone,
      shippingAddress: checkoutData.shippingAddress,
      payment: payment,
      note: checkoutData.note,
    });

    for (const lineItemData of lineItems) {
      await this.lineItemRepository.save({
        ...lineItemData,
        bill: { id: bill.id },
      });
    }

    for (const item of cart.cartItems) {
      item.product.quantityStock -= item.quantity;
      await this.productRepository.repository.save(item.product);
    }
    this.logger.log(`Stock reduced for bill: ${bill.id}`);

    if (
      checkoutData.paymentMethod === EPaymentMethod.CARD ||
      checkoutData.paymentMethod === EPaymentMethod.BANKING
    ) {
      if (!this.vnpayService) {
        throw new BadRequestException(
          'Phương thức thanh toán online không khả dụng. Vui lòng chọn COD.',
        );
      }
      try {
        const vnpayResponse = await this.vnpayService.createPaymentUrl({
          amount: total,
          orderInfo: `Thanh toan don hang ${billCode}`,
          orderType: ProductCode.Other,
          returnUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/vnpay-return`,
          ipAddr: checkoutData.ipAddr || '127.0.0.1',
          billCode: billCode,
        });

        paymentUrl = vnpayResponse.paymentUrl;
      } catch (error) {
        this.logger.error(
          `Failed to create VNPay payment URL: ${error.message}`,
        );
        throw new BadRequestException(
          'Không thể tạo link thanh toán. Vui lòng thử lại.',
        );
      }
    }

    await this.cartRepository.clearCart(cart.id);
    this.logger.log(
      `Checkout success for user: ${userId}, billId: ${bill.id}, status: ${billStatus}`,
    );

    // Create notification for user about new order
    try {
      await this.notificationService?.createNotification({
        recipientId: userId,
        title: 'Đơn hàng đã được tạo',
        description: `Đơn hàng #${bill.billCode} đã được tạo.`,
        type: ENotificationType.ORDER,
        url: `/client/bills/${bill.id}`,
      });

      await this.notificationService?.createNotification({
        recipientId: 0,
        title: 'Đơn hàng mới',
        description: `Đơn hàng #${bill.billCode} cần xử lý.`,
        type: ENotificationType.ORDER,
        url: `/admin/bills/${bill.id}`,
      });
    } catch (err) {
      this.logger.warn('Failed to create notification: ' + err?.message);
    }

    if (checkoutData.paymentMethod === EPaymentMethod.CASH) {
      return {
        success: true,
        message: 'Đặt hàng thành công. Vui lòng thanh toán khi nhận hàng.',
        billId: bill.id,
        billCode: bill.billCode,
      };
    }

    return {
      paymentUrl: paymentUrl,
      message: 'Đặt hàng thành công. Vui lòng thanh toán để hoàn tất đơn hàng.',
    };
  }

  async handleVNPayReturn(query: any) {
    if (!this.vnpayService) {
      throw new BadRequestException('VNPay service không khả dụng');
    }
    const isValid = await this.vnpayService.verifyReturnUrl(query);
    if (!isValid) {
      this.logger.error(
        `Invalid VNPay callback signature: ${query.vnp_TxnRef}`,
      );
      throw new BadRequestException('Xác thực thanh toán thất bại');
    }
    const vnpTxnRef = query.vnp_TxnRef;
    const billCode = parseInt(vnpTxnRef.split('_')[0]);

    const bill = await this.billRepository.findOne({
      where: { billCode },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'payment',
        'customer',
      ],
    });

    if (!bill) {
      this.logger.error(`Bill not found for VNPay transaction: ${vnpTxnRef}`);
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const responseCode = query.vnp_ResponseCode;
    if (responseCode === '00') {
      if (bill.payment) {
        bill.payment.paymentStatus = EPaymentStatus.SUCCESS;
        await this.paymentRepository.save(bill.payment);
      }

      await this.billRepository.save(bill);

      // Notify customer about successful payment
      try {
        if (bill.customer && bill.customer.id) {
          await this.notificationService?.createNotification({
            recipientId: bill.customer.id,
            title: 'Thanh toán thành công',
            description: `Đơn hàng #${bill.billCode} đã thanh toán thành công.`,
            type: ENotificationType.ORDER,
            url: `/client/bills/${bill.id}`,
          });
        }
      } catch (err) {
        this.logger.warn(
          'Failed to create payment success notification: ' + err?.message,
        );
      }
      return {
        success: true,
        message: 'Thanh toán thành công',
        bill: {
          id: bill.id,
          billCode: bill.billCode,
          total: bill.total,
          status: bill.status,
        },
      };
    } else {
      const errorMessage =
        this.vnpayService?.getResponseMessage(responseCode) ||
        'Thanh toán thất bại';
      return {
        success: false,
        message: errorMessage,
        bill: {
          id: bill.id,
          billCode: bill.billCode,
          status: bill.status,
        },
      };
    }
  }

  async cancelOrder(billId: number, userId: number) {
    this.logger.log(`Cancel order ${billId} by user ${userId}`);

    const bill = await this.billRepository.findOne({
      where: { id: billId },
      relations: ['customer', 'items', 'items.product', 'payment'],
    });

    if (!bill) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (bill.customer.id !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
    }
    if (bill.status === EBillStatus.PAID) {
      throw new BadRequestException(
        'Không thể hủy đơn hàng đã thanh toán. Vui lòng liên hệ CSKH.',
      );
    }
    if (bill.status === EBillStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng đã được hủy trước đó');
    }
    for (const item of bill.items) {
      item.product.quantityStock += item.quantity;
      await this.productRepository.repository.save(item.product);
    }
    this.logger.log(`Stock restored for cancelled bill: ${billId}`);

    bill.status = EBillStatus.CANCELLED;
    await this.billRepository.save(bill);
    try {
      if (bill.customer && bill.customer.id) {
        await this.notificationService?.createNotification({
          recipientId: bill.customer.id,
          title: 'Đơn hàng đã bị hủy',
          description: `Đơn hàng #${bill.billCode} đã được hủy.`,
          type: ENotificationType.ORDER,
          url: `/client/bills/${bill.id}`,
        });
      }
    } catch (err) {
      this.logger.warn('Failed to create cancel notification: ' + err?.message);
    }
    if (bill.payment && bill.payment.paymentStatus === EPaymentStatus.PENDING) {
      bill.payment.paymentStatus = EPaymentStatus.FAILED;
      await this.paymentRepository.save(bill.payment);
    }
    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
      billId: bill.id,
      billCode: bill.billCode,
    };
  }

  async recreatePaymentUrl(billCode: string, userId: number, ipAddr: string) {
    this.logger.log(
      `Recreate payment URL for billCode: ${billCode}, userId: ${userId}`,
    );

    const bill = await this.billRepository.findOne({
      where: { billCode: parseInt(billCode) },
      relations: ['customer', 'payment'],
    });

    if (!bill) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (bill.customer.id !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền tạo lại link thanh toán cho đơn hàng này',
      );
    }

    if (bill.status === EBillStatus.PAID) {
      throw new BadRequestException('Đơn hàng đã được thanh toán');
    }

    if (bill.status === EBillStatus.CANCELLED) {
      throw new BadRequestException(
        'Không thể tạo lại link thanh toán cho đơn hàng đã hủy',
      );
    }

    if (bill.paymentMethod === EPaymentMethod.CASH) {
      throw new BadRequestException(
        'Đơn hàng thanh toán COD không cần link thanh toán',
      );
    }

    if (!this.vnpayService) {
      throw new BadRequestException('Dịch vụ thanh toán online không khả dụng');
    }

    try {
      const vnpayResponse = await this.vnpayService.createPaymentUrl({
        amount: bill.total,
        orderInfo: `Thanh toan don hang ${bill.billCode}`,
        orderType: ProductCode.Other,
        returnUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/vnpay-return`,
        ipAddr: ipAddr || '127.0.0.1',
        billCode: bill.billCode,
      });

      this.logger.log(
        `Payment URL recreated successfully for bill: ${bill.billCode}`,
      );

      return {
        success: true,
        message: 'Tạo lại link thanh toán thành công',
        paymentUrl: vnpayResponse.paymentUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to recreate payment URL: ${error.message}`);
      throw new BadRequestException(
        'Không thể tạo lại link thanh toán. Vui lòng thử lại.',
      );
    }
  }

  async countBillsByStatus(status: EBillStatus): Promise<number> {
    return this.billRepository.countBillsByStatus(status);
  }

  async totalProfit(status: EBillStatus): Promise<number> {
    return this.lineItemRepository2.totalProfit(status);
  }

  async totalRevenue(status: EBillStatus): Promise<number> {
    return this.billRepository.totalRevenue(status);
  }

  async getRevenueOrProfitByTime(
    startDate: Date,
    endDate: Date,
    status: EBillStatus,
    type: 0 | 1,
  ): Promise<DashBoardResponseDto> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const bills = await this.billRepository.revenueByTime(start, end, status);

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const resultMap = new Map<string, number>();

    for (const bill of bills) {
      const date = new Date(bill.createdAt);
      let key = '';

      if (diffDays <= 1) {
        key = this.format(date, 'dd-MM-yyyy');
      } else if (diffDays <= 30) {
        key = this.format(date, 'dd-MM-yyyy');
      } else if (diffDays <= 92) {
        key = `Week ${this.getWeek(date)}, ${date.getFullYear()}`;
      } else if (diffDays <= 365 * 2) {
        key = this.format(date, 'MM-yyyy');
      } else {
        key = date.getFullYear().toString();
      }

      let amount = bill.total;

      if (type === 1) {
        for (const item of bill.items) {
          amount -= item.quantity * item.product.originalPrice;
        }
      }

      resultMap.set(key, (resultMap.get(key) || 0) + amount);
    }

    return {
      time: Array.from(resultMap.keys()),
      data: Array.from(resultMap.values()).map((v) => v.toString()),
    };
  }

  async getProductBestSellingByTime(
    startDate: Date,
    endDate: Date,
    status: EBillStatus,
  ): Promise<ProductBestSellingDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rawData = await this.lineItemRepository2.topSeller(
      start,
      end,
      EBillStatus.PAID,
    );

    return Promise.all(
      rawData.map(async (item) => {
        const product = await this.productRepository.findById(Number(item.id));
        return {
          id: Number(item.id),
          name: item.name,
          unitPrice: Number(item.unitPrice),
          quantitySold: Number(item.quantitySold),
          totalAmount: Number(item.totalAmount),
          url: product?.images?.[0]?.url || null,
        };
      }),
    );
  }

  async getNewUserByTime(
    startDate: Date,
    endDate: Date,
  ): Promise<DashBoardResponseDto> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const users = await this.userRepository.getNewUserByTime(start, end);

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const resultMap = new Map<string, number>();

    for (const user of users) {
      const date = new Date(user.createdAt);
      let key = '';

      if (diffDays <= 1) {
        key = this.format(date, 'dd-MM-yyyy');
      } else if (diffDays <= 30) {
        key = this.format(date, 'dd-MM-yyyy');
      } else if (diffDays <= 92) {
        key = `Week ${this.getWeek(date)}, ${date.getFullYear()}`;
      } else if (diffDays <= 365 * 2) {
        key = this.format(date, 'MM-yyyy');
      } else {
        key = date.getFullYear().toString();
      }

      resultMap.set(key, (resultMap.get(key) || 0) + 1);
    }

    return {
      time: Array.from(resultMap.keys()),
      data: Array.from(resultMap.values()).map((v) => v.toString()),
    };
  }

  private format(date: Date, pattern: string): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    if (pattern === 'dd-MM-yyyy') return `${dd}-${mm}-${yyyy}`;
    if (pattern === 'MM-yyyy') return `${mm}-${yyyy}`;
    return yyyy.toString();
  }

  private getWeek(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
