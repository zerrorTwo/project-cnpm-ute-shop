import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/entities/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    public readonly repository: Repository<Product>,
  ) {}

  /**
   * Lấy sản phẩm mới nhất (dùng id làm proxy cho createdAt nếu chưa có trường createdAt)
   */
  async findNewest(limit = 8): Promise<Product[]> {
    return this.repository.find({
      take: limit,
      where: { displayStatus: true },
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
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign')
      .where('product.displayStatus = :status', { status: true })
      .addSelect('COALESCE(SUM(li.quantity), 0)', 'sold')
      .groupBy('product.id')
      .orderBy('sold', 'DESC')
      .limit(limit);

    const products = await qb.getMany();

    // Load images separately to avoid GROUP BY issues
    for (const product of products) {
      product.images = await this.repository
        .createQueryBuilder('p')
        .relation(Product, 'images')
        .of(product.id)
        .loadMany();
    }

    return products;
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
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign')
      .where('product.displayStatus = :status', { status: true })
      .orderBy('product.views', 'DESC')
      .take(limit);

    const { entities } = await qb.getRawAndEntities();
    return entities;
  }

  /**
   * Lấy sản phẩm có khuyến mãi cao nhất (theo discountDetail.percentage)
   */
  async findTopDiscount(limit = 4): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.displayStatus = :status', { status: true })
      .orderBy('discountCampaign.percentage', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Tìm product theo id
   */
  async findById(id: number): Promise<Product | null> {
    if (!id) return null;
    return this.repository.findOne({
      where: { id },
      relations: ['images', 'brand', 'category', 'discountCampaign'],
    });
  }

  async findDetailById(id: number): Promise<Product | null> {
    if (!id) return null;
    return this.repository.findOne({
      where: { id },
      relations: [
        'images',
        'brand',
        'category',
        'discountCampaign',
        'configurations',
        'configurations.otherConfigs',
      ],
    });
  }

  /**
   * Tìm product theo slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['images', 'brand', 'category', 'discountCampaign'],
    });
  }

  /**
   * Filter và phân trang sản phẩm
   */
  async findAllProductWithPaging(
    page: number,
    limit: number,
    filters: {
      search?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ data: Product[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign');

    if (filters.search) {
      qb.andWhere('product.productName LIKE :search', {
        search: `%${filters.search}%`,
      });
      qb.andWhere('product.brand.brandName LIKE :search', {
        search: `%${filters.search}%`,
      });
      qb.andWhere('product.category.categoryName LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('product.id', filters.sortOrder || 'DESC');

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    return { data, total };
  }

  async findWithFilter(
    page: number,
    limit: number,
    filters: {
      search?: string;
      categoryId?: number;
      brandId?: number;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ data: Product[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign')
      .where('product.displayStatus = :status', { status: true });
    // Apply filters
    if (filters.search) {
      qb.andWhere('product.productName LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.categoryId) {
      qb.andWhere('product.category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.brandId) {
      qb.andWhere('product.brand.id = :brandId', {
        brandId: filters.brandId,
      });
    }

    if (filters.minPrice !== undefined) {
      qb.andWhere('product.unitPrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('product.unitPrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortField =
        filters.sortBy === 'price'
          ? 'product.unitPrice'
          : filters.sortBy === 'name'
            ? 'product.productName'
            : filters.sortBy === 'views'
              ? 'product.views'
              : filters.sortBy === 'rating'
                ? 'product.ratingAvg'
                : 'product.id';

      qb.orderBy(sortField, filters.sortOrder || 'DESC');
    } else {
      qb.orderBy('product.id', 'DESC');
    }

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    return { data, total };
  }
}
