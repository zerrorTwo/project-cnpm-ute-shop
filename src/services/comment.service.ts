import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentRepository } from '../repositories/comment.repository';
import { ProductRepository } from '../repositories/product.repository';
import { BillRepository } from '../repositories/bill.repository';
import { Comment } from '../entities/comment.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
} from '../dtos/comment.dto';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly productRepository: ProductRepository,
    private readonly billRepository: BillRepository,
  ) {}

  async createComment(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const { productId, description, parentId, billId } = createCommentDto;

    this.logger.log(
      `User ${userId} creating comment for product ${productId}`,
    );

    // Kiểm tra sản phẩm có tồn tại không
    const product = await this.productRepository.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Nếu có parentId, kiểm tra parent comment có tồn tại không
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        relations: ['product'],
      });

      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy comment cha');
      }

      // Kiểm tra parent comment có cùng product không
      if (parentComment.product.id !== productId) {
        throw new BadRequestException(
          'Comment cha phải thuộc cùng sản phẩm',
        );
      }
    }

    // Nếu có billId, kiểm tra bill có thuộc về user và có sản phẩm này không
    if (billId) {
      const bill = await this.billRepository.findOne({
        where: { id: billId },
        relations: ['customer', 'items', 'items.product'],
      });

      if (!bill) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (bill.customer.id !== userId) {
        throw new ForbiddenException(
          'Bạn không có quyền comment từ đơn hàng này',
        );
      }

      const productInBill = bill.items.find(
        (item) => item.product.id === productId,
      );

      if (!productInBill) {
        throw new BadRequestException(
          'Sản phẩm không có trong đơn hàng này',
        );
      }
    }

    // Tạo comment
    const comment = await this.commentRepository.save({
      customer: { id: userId } as any,
      product: { id: productId } as any,
      description,
      parent: parentId ? { id: parentId } as any : null,
      bill: billId ? { id: billId } as any : null,
    });

    this.logger.log(`Comment created with ID: ${comment.id}`);

    // Lấy comment với relations để trả về
    const savedComment = await this.commentRepository.findByIdWithRelations(
      comment.id,
    );

    return this.mapToResponseDto(savedComment!);
  }

  async getCommentsByProductId(
    productId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<CommentListResponseDto> {
    const { comments, total } =
      await this.commentRepository.findCommentsByProductIdWithReplies(
        productId,
        page,
        limit,
      );

    return {
      comments: comments.map((comment) => this.mapToResponseDto(comment)),
      total,
      page,
      limit,
    };
  }

  async getCommentById(id: number): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findByIdWithRelations(id);

    if (!comment) {
      throw new NotFoundException('Không tìm thấy comment');
    }

    return this.mapToResponseDto(comment);
  }

  async updateComment(
    userId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const { description } = updateCommentDto;

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['customer', 'product'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy comment');
    }

    // Chỉ cho phép user sở hữu comment mới được update
    if (comment.customer.id !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa comment này',
      );
    }

    // Cập nhật comment
    comment.description = description;

    await this.commentRepository.save(comment);

    const updatedComment = await this.commentRepository.findByIdWithRelations(
      commentId,
    );

    return this.mapToResponseDto(updatedComment!);
  }

  async deleteComment(userId: number, commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['customer', 'product'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy comment');
    }

    // Chỉ cho phép user sở hữu comment mới được xóa
    if (comment.customer.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa comment này');
    }

    // Hard delete - xóa comment khỏi database
    await this.commentRepository.remove(comment);

    this.logger.log(`Comment ${commentId} deleted by user ${userId}`);
  }

  async getUserComments(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<CommentListResponseDto> {
    const { comments, total } = await this.commentRepository.findByUserId(
      userId,
      page,
      limit,
    );

    return {
      comments: comments.map((comment) => this.mapToResponseDto(comment)),
      total,
      page,
      limit,
    };
  }

  // Admin methods
  async getAllComments(
    page: number = 1,
    limit: number = 10,
  ): Promise<CommentListResponseDto> {
    const { comments, total } = await this.commentRepository.findAllComments(
      page,
      limit,
    );

    return {
      comments: comments.map((comment) => this.mapToResponseDto(comment)),
      total,
      page,
      limit,
    };
  }

  async adminDeleteComment(commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['product'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy comment');
    }

    // Hard delete - xóa comment khỏi database
    await this.commentRepository.remove(comment);

    this.logger.log(`Comment ${commentId} deleted by admin`);
  }

  private mapToResponseDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      description: comment.description,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      customer: {
        id: comment.customer.id,
        fullName: comment.customer.fullName || 'Anonymous',
        email: comment.customer.email,
        avatar: comment.customer.avatar || undefined,
      },
      replies: comment.replies
        ? comment.replies.map((reply) => this.mapToResponseDto(reply))
        : undefined,
      parentId: comment.parent?.id || undefined,
    };
  }
}
