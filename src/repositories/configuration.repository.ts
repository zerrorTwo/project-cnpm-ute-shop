import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from 'src/entities/configuration.entity'; // Thay thế bằng đường dẫn thực tế
import { Product } from 'src/entities/product.entity'; // Cần cho các liên kết

@Injectable()
export class ConfigurationRepository {
  constructor(
    @InjectRepository(Configuration)
    private readonly repository: Repository<Configuration>,
  ) {}

  /**
   * Tìm Configuration theo ID, bao gồm các cấu hình chi tiết (otherConfigs)
   */
  async findById(id: number): Promise<Configuration | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['otherConfigs'], // Load các chi tiết cấu hình liên quan
    });
  }

  /**
   * Tìm Configuration theo ID Sản phẩm (Product ID)
   */
  async findByProductId(productId: number): Promise<Configuration | null> {
    return this.repository.findOne({
      where: { product: { id: productId } as Product },
      relations: ['otherConfigs'],
    });
  }

  /**
   * Tạo Configuration mới và liên kết với Product
   * @param data Dữ liệu Configuration (thường chỉ cần Product)
   */
  async create(data: { product: Product }): Promise<Configuration> {
    const config = this.repository.create(data);
    return this.repository.save(config);
  }

  /**
   * Xóa Configuration theo ID
   * Lưu ý: Việc xóa Configuration sẽ tự động xóa các DetailConfiguration liên quan
   * nhờ vào tùy chọn `onDelete: 'CASCADE'` và `cascade: true` trong định nghĩa entity.
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
