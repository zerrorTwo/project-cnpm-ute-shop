import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';
import { HttpStatusCode } from 'axios';
import { CartService } from 'src/services/cart.service';
import { AddToCartDto, UpdateCartItemDto } from 'src/dtos/cart.dto';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của user' })
  @ApiResponse({
    status: 200,
    description: 'Lấy giỏ hàng thành công',
    type: SuccessResponse,
  })
  async getCart(@CurrentUser('id') userId: number) {
    const result = await this.cartService.getCart(userId);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Thêm vào giỏ hàng thành công',
    type: SuccessResponse,
  })
  async addToCart(
    @CurrentUser('id') userId: number,
    @Body() addToCartDto: AddToCartDto,
  ) {
    console.log('AddToCart Body:', JSON.stringify(addToCartDto));
    const result = await this.cartService.addToCart(
      userId,
      addToCartDto.productId,
      addToCartDto.quantity,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message('Đã thêm sản phẩm vào giỏ hàng')
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Patch(':cartItemId')
  @ApiOperation({ summary: 'Cập nhật số lượng cart item' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: SuccessResponse,
  })
  async updateCartItem(
    @CurrentUser('id') userId: number,
    @Param('cartItemId') cartItemId: number,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const result = await this.cartService.updateCartItemQuantity(
      userId,
      cartItemId,
      updateDto.quantity,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Delete(':cartItemId')
  @ApiOperation({ summary: 'Xóa cart item' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: SuccessResponse,
  })
  async removeCartItem(
    @CurrentUser('id') userId: number,
    @Param('cartItemId') cartItemId: number,
  ) {
    const result = await this.cartService.removeCartItem(userId, cartItemId);

    return Builder<SuccessResponse>()
      .data(result)
      .message('Đã xóa sản phẩm khỏi giỏ hàng')
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa giỏ hàng thành công',
    type: SuccessResponse,
  })
  async clearCart(@CurrentUser('id') userId: number) {
    const result = await this.cartService.clearCart(userId);

    return Builder<SuccessResponse>()
      .data(result)
      .message('Đã xóa toàn bộ giỏ hàng')
      .status(HttpStatusCode.Ok)
      .build();
  }
}
