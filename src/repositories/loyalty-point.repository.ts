import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyPoint } from '../entities/loyalty-point.entity';

@Injectable()
export class LoyaltyPointRepository extends Repository<LoyaltyPoint> {
  constructor(private dataSource: DataSource) {
    super(LoyaltyPoint, dataSource.createEntityManager());
  }

  async getTotalPointsByUserId(userId: number): Promise<number> {
    const result = await this.createQueryBuilder('lp')
      .select(
        'SUM(CASE WHEN lp.transactionType = :earn THEN lp.points ELSE -lp.points END)',
        'total',
      )
      .where('lp.userId = :userId', { userId })
      .andWhere('lp.transactionType IN (:...types)', {
        types: ['EARN', 'REDEEM'],
      })
      .getRawOne();

    return result?.total || 0;
  }

  async getPointHistoryByUserId(userId: number): Promise<LoyaltyPoint[]> {
    return this.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
