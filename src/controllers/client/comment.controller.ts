import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import {
  CreateCommentDto,
  UpdateCommentDto,
} from '../../dtos/comment.dto';
import { CommentService } from '../../services/comment.service';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { CurrentUser } from '../../utils/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo comment mới cho sản phẩm',
    description:
      'Tạo comment mới. Có thể là comment gốc hoặc reply cho comment khác.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo comment thành công',
    type: SuccessResponse,
  })
  async createComment(
    @CurrentUser('id') userId: number,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const result = await this.commentService.createComment(
      userId,
      createCommentDto,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message('Tạo comment thành công')
      .status(201)
      .build();
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Lấy danh sách comments của sản phẩm',
    description: 'Lấy danh sách comments (có phân trang) và replies của sản phẩm',
  })
  @ApiParam({ name: 'productId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách comments thành công',
    type: SuccessResponse,
  })
  async getProductComments(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.commentService.getCommentsByProductId(
      +productId,
      page ? +page : 1,
      limit ? +limit : 10,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết comment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin comment thành công',
    type: SuccessResponse,
  })
  async getCommentById(@Param('id') id: string) {
    const result = await this.commentService.getCommentById(+id);
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật comment',
    description: 'Chỉ user sở hữu comment mới có thể cập nhật',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật comment thành công',
    type: SuccessResponse,
  })
  async updateComment(
    @CurrentUser('id') userId: number,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const result = await this.commentService.updateComment(
      userId,
      +id,
      updateCommentDto,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message('Cập nhật comment thành công')
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa comment',
    description: 'Chỉ user sở hữu comment mới có thể xóa',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Xóa comment thành công',
  })
  async deleteComment(
    @CurrentUser('id') userId: number,
    @Param('id') id: string,
  ) {
    await this.commentService.deleteComment(userId, +id);
    return Builder<SuccessResponse>()
      .message('Xóa comment thành công')
      .status(204)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get('user/my-comments')
  @ApiOperation({ summary: 'Lấy danh sách comments của user hiện tại' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách comments thành công',
    type: SuccessResponse,
  })
  async getMyComments(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.commentService.getUserComments(
      userId,
      page ? +page : 1,
      limit ? +limit : 10,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }
}
