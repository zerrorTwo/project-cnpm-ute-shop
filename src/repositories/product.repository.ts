import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/entities/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  /**
   * Lấy sản phẩm mới nhất (dùng id làm proxy cho createdAt nếu chưa có trường createdAt)
   */
  async findNewest(limit = 8): Promise<Product[]> {
    return this.repository.find({
      take: limit,
      order: { id: 'DESC' },
      relations: ['images', 'brand', 'category', 'discountDetail'],
    });
  }

  /**
   * Lấy sản phẩm bán chạy nhất dựa trên tổng quantity của line_items
   */
  async findBestSelling(limit = 6): Promise<Product[]> {
    const qb = this.repository
      .createQueryBuilder('product')
      .leftJoin('product.lineItems', 'li')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.discountDetail', 'discountDetail')
      .addSelect('COALESCE(SUM(li.quantity), 0)', 'sold')
      .groupBy('product.id')
      .orderBy('sold', 'DESC')
      .limit(limit);

    const { entities } = await qb.getRawAndEntities();
    return entities;
  }

  /**
   * Lấy sản phẩm được "xem nhiều nhất".
   * NOTE: Project hiện không có trường `viewCount` trên `products`.
   *  - Hiện tại sử dụng số lượng comment như một proxy cho mức độ tương tác.
   *  - Nếu bạn thêm `viewCount` trên `products`, thay query này bằng orderBy('product.viewCount', 'DESC').
   */
  async findMostViewed(limit = 8): Promise<Product[]> {
    const qb = this.repository
      .createQueryBuilder('product')
      .leftJoin('product.comments', 'c')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.discountDetail', 'discountDetail')
      .addSelect('COALESCE(COUNT(c.id), 0)', 'views')
      .groupBy('product.id')
      .orderBy('views', 'DESC')
      .limit(limit);

    const { entities } = await qb.getRawAndEntities();
    return entities;
  }

  /**
   * Lấy sản phẩm có khuyến mãi cao nhất (theo discountDetail.percentage)
   */
  async findTopDiscount(limit = 4): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.discountDetail', 'discountDetail')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .orderBy('discountDetail.percentage', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Tìm product theo id
   */
  async findById(id: number): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['images', 'brand'],
    });
  }
}
