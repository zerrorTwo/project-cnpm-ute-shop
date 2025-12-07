import {
  Controller,
  Get,
  Delete,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Builder } from 'builder-pattern';

import { SuccessMessages } from '../../constants/messages';
import { SuccessResponse } from '../../dtos/response.dto';
import { CommentService } from '../../services/comment.service';
import { AuthGuard } from '../../utils/auth/auth.guard';

@ApiTags('Admin - Comments')
@Controller('comments')
export class AdminCommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả comments (Admin)',
    description: 'Admin có thể xem tất cả comments',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách comments thành công',
    type: SuccessResponse,
  })
  async getAllComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.commentService.getAllComments(
      page ? +page : 1,
      limit ? +limit : 10,
    );
    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(200)
      .build();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết comment (Admin)' })
  @ApiBearerAuth()
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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa comment (Admin)',
    description: 'Admin có thể xóa bất kỳ comment nào',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Xóa comment thành công',
  })
  async deleteComment(@Param('id') id: string) {
    await this.commentService.adminDeleteComment(+id);
    return Builder<SuccessResponse>()
      .message('Xóa comment thành công')
      .status(204)
      .build();
  }
}
