import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async sendRegisterOtp(email: string) {
    const otp = this.generateOtp();
    this.logger.log(
      `Generated Register OTP for ${email}: ${otp}`,
      'MailService',
    );

    await this.redis.setex(`otp:register:${email}`, 300, otp);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Mã xác minh đăng ký',
      html: `<p>Mã OTP đăng ký của bạn là <b>${otp}</b>. Có hiệu lực trong 5 phút.</p>`,
    });

    return { message: 'OTP đăng ký đã được gửi tới email.' };
  }

  async sendResetPasswordOtp(email: string) {
    const otp = this.generateOtp();

    await this.redis.setex(`otp:reset:${email}`, 300, otp);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu',
      html: `<p>Mã OTP đặt lại mật khẩu của bạn là <b>${otp}</b>. Có hiệu lực trong 5 phút.</p>`,
    });

    return { message: 'OTP khôi phục mật khẩu đã được gửi tới email.' };
  }

  async validateOtp(
    keyPrefix: 'register' | 'reset',
    email: string,
    otp: string,
  ): Promise<boolean> {
    const redisKey = `otp:${keyPrefix}:${email}`;
    const savedOtp = await this.redis.get(redisKey);

    this.logger.log(
      `Validating OTP for ${email}: input=${otp}, saved=${savedOtp}`,
      'MailService',
    );

    if (!savedOtp) {
      this.logger.warn(`OTP expired or not found for ${email}`, 'MailService');
      throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại');
    }

    if (savedOtp !== otp) {
      this.logger.warn(
        `OTP mismatch for ${email}: input=${otp}, expected=${savedOtp}`,
        'MailService',
      );
      throw new BadRequestException('OTP không chính xác');
    }

    await this.redis.del(redisKey);
    this.logger.log(`OTP validated successfully for ${email}`, 'MailService');
    return true;
  }

  generateOtp(length = 6): string {
    return Math.floor(100000 + Math.random() * 900000)
      .toString()
      .substring(0, length);
  }
}
