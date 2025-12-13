import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Bill, EBillStatus } from '../entities/bill.entity';

@Injectable()
export class BillRepository {
  constructor(
    @InjectRepository(Bill)
    private readonly repository: Repository<Bill>,
  ) {}

  /**
   * Tìm bill theo ID
   */
  async findById(id: number): Promise<Bill | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'customer',
        'payment',
        'items',
        'items.product',
        'items.product.images',
      ],
    });
  }

  /**
   * Tìm bill với điều kiện tùy chỉnh
   */
  async findOne(options: any): Promise<Bill | null> {
    return this.repository.findOne(options);
  }

  /**
   * Lưu bill
   */
  async save(bill: Bill): Promise<Bill> {
    return this.repository.save(bill);
  }

  /**
   * Tìm bills theo user ID
   */
  async findByUserId(userId: number): Promise<Bill[]> {
    return this.repository.find({
      where: { customer: { id: userId } },
      relations: [
        'customer',
        'payment',
        'items',
        'items.product',
        'items.product.images',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Tìm bills theo user ID với phân trang và tìm kiếm
   */
  async findByUserIdWithPagination(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ): Promise<{ data: Bill[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.payment', 'payment')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .where('customer.id = :userId', { userId });

    // Filter theo status
    if (status) {
      qb.andWhere('bill.status = :status', { status });
    }

    // Tìm kiếm theo tên sản phẩm hoặc mã đơn
    if (search) {
      qb.andWhere(
        '(product.productName LIKE :search OR bill.billCode LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Đếm tổng số
    const total = await qb.getCount();

    // Phân trang
    const data = await qb
      .orderBy('bill.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * Tạo bill mới
   */
  async create(data: Partial<Bill>): Promise<Bill> {
    const bill = this.repository.create(data);
    return this.repository.save(bill);
  }

  /**
   * Cập nhật bill
   */
  async update(id: number, data: Partial<Bill>): Promise<Bill | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Xóa bill
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countBillsByStatus(status: EBillStatus): Promise<number> {
    return this.repository
      .createQueryBuilder('b')
      .where('b.status = :status', { status })
      .getCount();
  }

  async revenueByTime(
    start: Date,
    end: Date,
    status: EBillStatus,
  ): Promise<Bill[]> {
    return this.repository.find({
      where: {
        status,
        createdAt: Between(start, end),
      },
      order: {
        createdAt: 'ASC',
      },
      relations: ['items', 'items.product'],
    });
  }

  async totalRevenue(status: EBillStatus): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('b')
      .select('SUM(b.total)', 'total')
      .where('b.status = :status', { status })
      .getRawOne();

    return Number(result.total) || 0;
  }
}
