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
    const sql = `
    SELECT
      p.id AS id,
      p.productName AS name,
      p.unitPrice AS unitPrice,
      SUM(li.quantity) AS quantitySold,
      SUM(li.quantity * p.unitPrice) AS totalAmount,
      COUNT(DISTINCT b.id) AS totalOrders
    FROM line_items li
    INNER JOIN products p ON li.product_id = p.id
    INNER JOIN bills b ON li.bill_id = b.id
    WHERE b.createdAt BETWEEN ? AND ?
      AND b.status = ?
    GROUP BY p.id, p.productName, p.unitPrice
    ORDER BY quantitySold DESC
    LIMIT 10
  `;

    const startStr = formatDateStart(startDate);
    const endStr = formatDateEnd(endDate);

    return this.repository.query(sql, [startStr, endStr, 'PAID']);
    // return this.repository.query(sql, ['2025-11-30', '2025-12-15', 'PAID']);
  }
}

function formatDateStart(date: Date) {
  return date.toISOString().slice(0, 10) + ' 00:00:00';
}

function formatDateEnd(date: Date) {
  return date.toISOString().slice(0, 10) + ' 23:59:59';
}
