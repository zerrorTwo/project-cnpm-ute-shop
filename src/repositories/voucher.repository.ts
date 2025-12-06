import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';

@Injectable()
export class VoucherRepository extends Repository<Voucher> {
  constructor(private dataSource: DataSource) {
    super(Voucher, dataSource.createEntityManager());
  }

  async findActiveByUserId(userId: number): Promise<Voucher[]> {
    return this.find({
      where: {
        user: { id: userId },
        status: 'ACTIVE' as any,
      },
      order: { expiryDate: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Voucher | null> {
    return this.findOne({ where: { code } });
  }
}
