import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth/common';
import { RegisterDto, LoginDto, UpdateProfileDto } from '../dtos/auth.dto';
import type { Response } from 'express';
import { ErrorMessages } from '../constants/messages';
import { UserRepository } from '../repositories/user.repository';
import { MailService } from '../services/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    this.logger.log(
      `Register request: email=${email}, fullName=${fullName}`,
      'AuthService',
    );
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Email đã tồn tại: ${email}`, 'AuthService');
      throw new BadRequestException(ErrorMessages.EMAIL_ALREADY_EXISTS);
    }
    await this.mailService.sendRegisterOtp(email);
    this.logger.log(`OTP đã gửi tới email: ${email}`, 'AuthService');
    return { message: 'OTP đã được gửi tới email của bạn.' };
  }

  async verifyOtp(registerDto: RegisterDto, otp: string) {
    this.logger.log(
      `Verify OTP: email=${registerDto.email}, otp=${otp}`,
      'AuthService',
    );
    const isValiedOTP = this.mailService.validateOtp(
      'register',
      registerDto.email,
      otp,
    );
    if (!isValiedOTP) {
      this.logger.warn(
        `OTP không hợp lệ hoặc hết hạn: email=${registerDto.email}, otp=${otp}`,
        'AuthService',
      );
      throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại');
    }
    const hashedPassword = await hashPassword(registerDto.password);
    const user = await this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
    });
    this.logger.log(
      `Tạo tài khoản thành công: email=${user.email}, id=${user.id}`,
      'AuthService',
    );
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      message: 'Xác minh OTP thành công. Tài khoản đã được tạo.',
    };
  }
  async login(loginDto: LoginDto, response: Response) {
    const { email, password } = loginDto;
    this.logger.log(`Login request: email=${email}`, 'AuthService');
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Login failed: email không tồn tại - ${email}`,
        'AuthService',
      );
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: sai mật khẩu - ${email}`, 'AuthService');
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
    this.logger.log(
      `Login thành công: email=${email}, id=${user.id}`,
      'AuthService',
    );
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
    this.logger.log(`Refresh token request`, 'AuthService');
    if (!refreshToken) {
      this.logger.warn(`Refresh token missing`, 'AuthService');
      throw new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_REQUIRED);
    }
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      // Find user
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        this.logger.warn(
          `Refresh token failed: user not found - id=${decoded.id}`,
          'AuthService',
        );
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
      this.logger.log(
        `Refresh token thành công: userId=${user.id}`,
        'AuthService',
      );
      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      this.logger.error(
        `Refresh token thất bại: ${error}`,
        undefined,
        'AuthService',
      );
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
    }
  }

  async logout(response: Response) {
    response.clearCookie('refreshToken');
    this.logger.log(`Logout thành công`, 'AuthService');
    return {
      message: 'Logout successful',
    };
  }

  async getProfile(userId: number) {
    this.logger.log(`Get profile: userId=${userId}`, 'AuthService');
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(
        `Get profile thất bại: user không tồn tại - userId=${userId}`,
        'AuthService',
      );
      throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }
    this.logger.log(`Get profile thành công: userId=${userId}`, 'AuthService');
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    };
  }

  async forgotPassword(email: string) {
    this.logger.log(`Quên mật khẩu: email=${email}`, 'AuthService');
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Quên mật khẩu thất bại: email không tồn tại - ${email}`,
        'AuthService',
      );
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }
    await this.mailService.sendResetPasswordOtp(email);
    this.logger.log(
      `OTP khôi phục mật khẩu đã gửi tới email: ${email}`,
      'AuthService',
    );
    return { message: 'OTP khôi phục mật khẩu đã được gửi tới email.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    this.logger.log(
      `Đặt lại mật khẩu: email=${email}, otp=${otp}`,
      'AuthService',
    );
    const isValid = await this.mailService.validateOtp('reset', email, otp);
    if (!isValid) {
      this.logger.warn(
        `Đặt lại mật khẩu thất bại: OTP không hợp lệ - email=${email}, otp=${otp}`,
        'AuthService',
      );
      throw new BadRequestException('OTP không hợp lệ');
    }
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Đặt lại mật khẩu thất bại: người dùng không tồn tại - email=${email}`,
        'AuthService',
      );
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.updatePassword(user.email, hashedPassword);
    this.logger.log(
      `Đặt lại mật khẩu thành công: email=${email}`,
      'AuthService',
    );
    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }

  async generateTokenGoogle(profile: any, response: Response) {
    this.logger.log(
      `Google login: email=${profile.email}, displayName=${profile.displayName}`,
      'AuthService',
    );
    const email = profile.email;
    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      const hashedPassword = await hashPassword('uteShop@');
      user = await this.userRepository.create({
        email,
        fullName: profile.displayName,
        password: hashedPassword,
      });
      this.logger.log(
        `Tạo user mới qua Google: email=${email}, id=${user.id}`,
        'AuthService',
      );
    }
    const payload = { id: user.id, email: user.email };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.logger.log(
      `Google login thành công: email=${email}, id=${user.id}`,
      'AuthService',
    );
    return {
      newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }
  
  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const updated = await this.userRepository.update(userId, updateDto);

    if (!updated) {
      throw new BadRequestException('Failed to update profile');
    }

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      updatedAt: updated.updatedAt,
    };
  }
}
