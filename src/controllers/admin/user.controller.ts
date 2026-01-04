import {
  Controller,
  Get,
  Query,
  Param,
  Put,
  Body,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { Builder } from 'builder-pattern';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;

    const result = await this.userService.getAllUsers(pageNumber, limitNumber);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Get('/search')
  async searchUsers(@Query('keyword') keyword: string) {
    const users = await this.userService.searchUsers(keyword);

    return Builder<SuccessResponse>()
      .data(users)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Get('/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getUserById(id);

    return Builder<SuccessResponse>()
      .data(user)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Put('/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    const user = await this.userService.updateUser(id, updateData);

    return Builder<SuccessResponse>()
      .data(user)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }
}
