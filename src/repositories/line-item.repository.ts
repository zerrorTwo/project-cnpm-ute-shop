import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBillStatus } from '../entities/bill.entity';
import { LineItem } from 'src/entities/line-item.entity';

@Injectable()
export class LineItemRepository {
  constructor(
    @InjectRepository(LineItem)
    private readonly repository: Repository<LineItem>,
  ) {}


  async totalProfit(status: EBillStatus): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('od')
      .innerJoin('od.product', 'p')
      .innerJoin('od.bill', 'o')
      .select('SUM(od.quantity * (od.unitPrice - p.originalPrice))', 'profit')
      .where('o.status = :status', { status })
      .getRawOne();

    return Number(result.profit) || 0;
  }

  async topSeller(startDate: Date, endDate: Date, status: EBillStatus) {
    return this.repository
      .createQueryBuilder('li')
      .innerJoin('li.product', 'p')
      .innerJoin('li.bill', 'b')
      .where('b.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('b.status = :status', { status })
      .select([
        'p.id AS id',
        'p.productName AS name',
        'p.unitPrice AS unitPrice',
        'SUM(li.quantity) AS quantitySold',
        'SUM(li.quantity * li.unitPrice) AS totalAmount',
        'COUNT(DISTINCT b.id) AS totalOrders',
      ])
      .groupBy('p.id')
      .orderBy('quantitySold', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
