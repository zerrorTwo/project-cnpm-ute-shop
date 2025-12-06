import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentRepository extends Repository<Comment> {
  constructor(private dataSource: DataSource) {
    super(Comment, dataSource.createEntityManager());
  }

  async findByProductId(productId: number): Promise<Comment[]> {
    return this.find({
      where: { product: { id: productId }, active: true },
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
}
