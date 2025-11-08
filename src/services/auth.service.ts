import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth/common';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import type { Response } from 'express';
import { ErrorMessages } from '../constants/messages';
import { UserRepository } from '../repositories/user.repository';
import { MailService } from '../services/mail.service';
@Injectable()
export class AuthService {
  constructor(
     private readonly userRepository: UserRepository,
    private readonly mailService: MailService) {}

  async register(registerDto: RegisterDto) {
      const { email, password, fullName } = registerDto;

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException(ErrorMessages.EMAIL_ALREADY_EXISTS);
      }
      await this.mailService.sendRegisterOtp(email);
      return { message: 'OTP đã được gửi tới email của bạn.' };
    }

  async verifyOtp(registerDto: RegisterDto, otp: string) {
    const isValiedOTP = this.mailService.validateOtp('register',registerDto.email, otp); 
    if (!isValiedOTP) {
      throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại');
    }
    const hashedPassword = await hashPassword(registerDto.password);
    const user = await this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      message: 'Xác minh OTP thành công. Tài khoản đã được tạo.',
    };
  }
  async login(loginDto: LoginDto, response: Response) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async refreshToken(refreshToken: string, response: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_REQUIRED);
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
      }

      // Generate new tokens
      const payload = { id: user.id, email: user.email };
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Set new refresh token in cookie
      response.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
    }
  }

  async logout(response: Response) {
    // Clear cookie
    response.clearCookie('refreshToken');

    return {
      message: 'Logout successful',
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    };
  }

   async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    await this.mailService.sendResetPasswordOtp(email);

    return { message: 'OTP khôi phục mật khẩu đã được gửi tới email.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const isValid = await this.mailService.validateOtp('reset', email, otp);
    if (!isValid) {
      throw new BadRequestException('OTP không hợp lệ');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.updatePassword(user.email, hashedPassword);

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }
}
