import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../entities/bill.entity';

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
}
