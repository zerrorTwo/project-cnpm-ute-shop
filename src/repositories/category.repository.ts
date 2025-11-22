import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity'; // Thay thế bằng đường dẫn thực tế của bạn
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  /**
   * Tìm Category theo ID
   */
  async findById(id: number): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Tạo Category mới
   */
  async create(data: Partial<Category>): Promise<Category> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  /**
   * Cập nhật Category theo ID
   */
  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    await this.repository.update(id, data);
    // Trả về Category đã cập nhật
    return this.findById(id);
  }

  /**
   * Xóa Category theo ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    // Trả về true nếu có ít nhất một hàng bị ảnh hưởng
    return (result.affected ?? 0) > 0;
  }

  /**
   * Lấy tất cả Category (Ví dụ thêm)
   */
  async findAll(): Promise<Category[]> {
    return this.repository.find();
  }
}
