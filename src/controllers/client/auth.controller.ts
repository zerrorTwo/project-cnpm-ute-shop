import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Builder } from 'builder-pattern';
import { HttpStatusCode } from 'axios';
import { AuthService } from '../../services/auth.service';
import { MailService } from '../../services/mail.service';
import { RegisterDto, LoginDto } from '../../dtos/auth.dto';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { Public } from '../../utils/auth/public.decorator';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';
import { AuthGuard as PassportAuthGuard} from '@nestjs/passport';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly mailService: MailService,
    private readonly authService: AuthService) {}

  @Public()
  @Post('register')
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
  async getProfile(@CurrentUser('id') userId: number) {
    const result = await this.authService.getProfile(userId);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Post('verify-account')
  async verifyAccount(@Body() registerDto: RegisterDto,@Body('otp') otp: string) {
    const result = await this.authService.verifyOtp(registerDto, otp);
     return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

@Public()
  @Post('forgot-password')
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
  async resetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    const result = await this.authService.resetPassword(email, otp, newPassword);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {
  }
  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const result = await this.authService.generateTokenGoogle(user, res);

    res.redirect(
      `http://localhost:3000/login-success?token=${result.newAccessToken}`
    );
  }
}
