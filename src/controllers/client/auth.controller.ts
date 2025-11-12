import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import type { Request, Response } from 'express';

import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { SuccessMessages } from '../../constants/messages';
import { LoginDto, RegisterDto } from '../../dtos/auth.dto';
import { SuccessResponse } from '../../dtos/response.dto';
import { AuthService } from '../../services/auth.service';
import { MailService } from '../../services/mail.service';

import { RegisterDto, LoginDto, UpdateProfileDto } from '../../dtos/auth.dto';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { Public } from '../../utils/auth/public.decorator';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import { AuthGuard } from '../../utils/auth/auth.guard';
import { Public } from '../../utils/auth/public.decorator';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: SuccessResponse,
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.REGISTER_SUCCESSFULLY)
      .status(HttpStatusCode.Created)
      .build();
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string' }, password: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: SuccessResponse,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, response);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.LOGIN_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: SuccessResponse,
  })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    const result = await this.authService.refreshToken(refreshToken, response);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.REFRESH_TOKEN_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    type: SuccessResponse,
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(response);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.LOGOUT_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin profile người dùng' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lấy profile thành công',
    type: SuccessResponse,
  })
  async getProfile(@CurrentUser('id') userId: number) {
    const result = await this.authService.getProfile(userId);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
  @UseGuards(AuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() updateDto: UpdateProfileDto,
  ) {
    const result = await this.authService.updateProfile(userId, updateDto);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Post('verify-account')

  @ApiOperation({ summary: 'Xác thực tài khoản bằng OTP' })
  @ApiBody({
    schema: {
      properties: {
        otp: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    type: SuccessResponse,
  })
  async verifyAccount(
    @Body() registerDto: RegisterDto,
    @Body('otp') otp: string,
  ) {
    const result = await this.authService.verifyOtp(registerDto, otp);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Quên mật khẩu - gửi OTP về email' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Gửi OTP thành công',
    type: SuccessResponse,
  })
  async forgotPassword(@Body('email') email: string) {
    const result = await this.authService.forgotPassword(email);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng OTP' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        otp: { type: 'string' },
        newPassword: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    type: SuccessResponse,
  })
  async resetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    const result = await this.authService.resetPassword(
      email,
      otp,
      newPassword,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth2 login' })
  @UseGuards(PassportAuthGuard('google'))

  async googleAuth() {}
  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const result = await this.authService.generateTokenGoogle(user, res);
    res.redirect(
      `http://localhost:3000/login-success?token=${result.newAccessToken}`,
    );
  }
}
