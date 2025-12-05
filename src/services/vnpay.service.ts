import { Injectable, Logger } from '@nestjs/common';
import {
  ProductCode,
  VnpLocale,
  dateFormat,
  getDateInGMT7,
  VNPay,
} from 'vnpay';
import { ConfigService } from '@nestjs/config';

export interface VNPayPaymentData {
  amount: number;
  bankCode?: string;
  orderInfo: string;
  orderType: ProductCode;
  returnUrl: string;
  ipAddr: string;
  locale?: VnpLocale;
}

export interface VNPayPaymentResponse {
  paymentUrl: string;
  vnp_TxnRef: string;
}

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);
  private readonly returnUrl: string;
  private readonly vnpay: VNPay;

  constructor(private readonly configService: ConfigService) {
    this.returnUrl = this.configService.get<string>(
      'VNPAY_RETURN_URL',
      'http://localhost:3000/client/payment/vnpay-return',
    );

    // Tạo VNPay instance trực tiếp
    this.vnpay = new VNPay({
      tmnCode: this.configService.get<string>('VNPAY_TMN_CODE', ''),
      secureSecret: this.configService.get<string>('VNPAY_SECURE_SECRET', ''),
    });
  }

  async createPaymentUrl(
    paymentData: VNPayPaymentData,
  ): Promise<VNPayPaymentResponse> {
    try {
      // unique
      const vnp_TxnRef = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const createDate = dateFormat(getDateInGMT7(new Date()));

      const paymentUrl = this.vnpay.buildPaymentUrl({
        vnp_Amount: paymentData.amount,
        vnp_IpAddr: paymentData.ipAddr,
        vnp_TxnRef: vnp_TxnRef,
        vnp_OrderInfo: paymentData.orderInfo,
        vnp_OrderType: paymentData.orderType,
        vnp_ReturnUrl: paymentData.returnUrl || this.returnUrl,
        vnp_Locale: paymentData.locale || VnpLocale.VN,
        vnp_CreateDate: createDate,
        ...(paymentData.bankCode && { vnp_BankCode: paymentData.bankCode }),
      });
      return {
        paymentUrl,
        vnp_TxnRef,
      };
    } catch (error) {
      this.logger.error(`Failed to create VNPay payment URL: ${error.message}`);
      throw error;
    }
  }

  async verifyReturnUrl(query: any): Promise<boolean> {
    try {
      const verify = await this.vnpay.verifyReturnUrl(query);

      if (!verify.isVerified) {
        this.logger.warn(`VNPay signature verification failed`);
        return false;
      }

      if (!verify.isSuccess) {
        this.logger.warn(
          `VNPay payment failed with code: ${query.vnp_ResponseCode}`,
        );
        return false;
      }

      this.logger.log(
        `VNPay payment verified successfully: ${query.vnp_TxnRef}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify VNPay return URL: ${error.message}`);
      return false;
    }
  }

  async verifyIpnCall(query: any) {
    try {
      const verify = await this.vnpay.verifyIpnCall(query);
      this.logger.log(
        `VNPay IPN verified: ${query.vnp_TxnRef}, success: ${verify.isSuccess}`,
      );
      return verify;
    } catch (error) {
      this.logger.error(`Failed to verify VNPay IPN: ${error.message}`);
      throw error;
    }
  }

  getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác',
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }
}
