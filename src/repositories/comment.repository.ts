import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentRepository extends Repository<Comment> {
  constructor(private dataSource: DataSource) {
    super(Comment, dataSource.createEntityManager());
  }

  async findByProductId(productId: number): Promise<Comment[]> {
    return this.find({
      where: { product: { id: productId } },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserReviewedProduct(
    userId: number,
    productId: number,
    billId: number,
  ): Promise<boolean> {
    const count = await this.count({
      where: {
        customer: { id: userId },
        product: { id: productId },
        bill: { id: billId },
      },
    });
    return count > 0;
  }

  async findCommentsByProductIdWithReplies(
    productId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ comments: Comment[]; total: number }> {
    const skip = (page - 1) * limit;

    // Lấy tất cả comments (chỉ parent comments, không có replies)
    const [comments, total] = await this.findAndCount({
      where: {
        product: { id: productId },
        parent: IsNull(), // Chỉ lấy comments gốc, không phải replies
      },
      relations: ['customer', 'replies', 'replies.customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { comments, total };
  }

  async findByIdWithRelations(id: number): Promise<Comment | null> {
    return this.findOne({
      where: { id },
      relations: ['customer', 'product', 'parent', 'replies', 'replies.customer'],
    });
  }

  async findRepliesByParentId(parentId: number): Promise<Comment[]> {
    return this.find({
      where: { parent: { id: parentId } },
      relations: ['customer'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByUserId(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [comments, total] = await this.findAndCount({
      where: { customer: { id: userId } },
      relations: ['product', 'parent'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { comments, total };
  }

  async findAllComments(
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [comments, total] = await this.findAndCount({
      relations: ['customer', 'product', 'parent'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { comments, total };
  }
}
