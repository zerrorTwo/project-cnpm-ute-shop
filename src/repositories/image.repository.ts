import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from 'src/entities/image.entity'; 
import { Product } from 'src/entities/product.entity'; 

@Injectable()
export class ImageRepository {
  constructor(
    @InjectRepository(Image)
    private readonly repository: Repository<Image>,
  ) {}

  /**
   * Tìm Image theo ID
   */
  async findById(id: number): Promise<Image | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Lấy tất cả ảnh của một sản phẩm
   */
  async findByProductId(productId: number): Promise<Image[]> {
    return this.repository.find({
      where: { product: { id: productId } as Product }, // Liên kết qua Product ID
      order: { createdAt: 'ASC' }, // Sắp xếp theo thứ tự tạo
    });
  }

  /**
   * Tạo Image mới
   * @param data Dữ liệu URL và Product (hoặc Product ID)
   */
  async create(data: { url: string; product: Product }): Promise<Image> {
    const image = this.repository.create(data);
    return this.repository.save(image);
  }

  /**
   * Tạo nhiều Image cùng lúc (thường dùng khi thêm sản phẩm)
   * @param dataList Mảng các đối tượng chứa url và product
   */
  async createMany(
    dataList: Array<{ url: string; product: Product }>,
  ): Promise<Image[]> {
    const images = this.repository.create(dataList);
    return this.repository.save(images);
  }

  /**
   * Xóa Image theo ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    // Trả về true nếu có ít nhất một hàng bị ảnh hưởng
    return (result.affected ?? 0) > 0;
  }

  /**
   * Xóa tất cả ảnh của một sản phẩm (thường dùng khi xóa sản phẩm hoặc cập nhật)
   */
  async deleteByProductId(productId: number): Promise<boolean> {
    const result = await this.repository.delete({
      product: { id: productId } as Product, // Xóa tất cả ảnh có product ID này
    });
    return (result.affected ?? 0) > 0;
  }
}
