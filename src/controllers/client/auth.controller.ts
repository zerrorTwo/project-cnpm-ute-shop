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
import { RegisterDto, LoginDto } from '../../dtos/auth.dto';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { Public } from '../../utils/auth/public.decorator';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
