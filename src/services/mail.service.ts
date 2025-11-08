import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async sendRegisterOtp(email: string) {
    const otp = this.generateOtp();

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


  async validateOtp(keyPrefix: 'register' | 'reset', email: string, otp: string): Promise<boolean> {
    const redisKey = `otp:${keyPrefix}:${email}`;
    const savedOtp = await this.redis.get(redisKey);

    if (!savedOtp) {
      throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại');
    }

    if (savedOtp !== otp) {
      throw new BadRequestException('OTP không chính xác');
    }

    await this.redis.del(redisKey);
    return true;
  }

  generateOtp(length = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
  }
}
