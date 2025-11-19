import { Injectable } from '@nestjs/common';
import { ProductRepository } from 'src/repositories/product.repository';
import { Product } from 'src/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getNewest(limit = 8): Promise<Product[]> {
    return this.productRepository.findNewest(limit);
  }

  async getBestSelling(limit = 6): Promise<Product[]> {
    return this.productRepository.findBestSelling(limit);
  }

  async getMostViewed(limit = 8): Promise<Product[]> {
    return this.productRepository.findMostViewed(limit);
  }

  async getTopDiscount(limit = 4): Promise<Product[]> {
    return this.productRepository.findTopDiscount(limit);
  }

  async getHomeProducts(): Promise<{
    newest: Product[];
    bestSelling: Product[];
    mostViewed: Product[];
    topDiscount: Product[];
  }> {
    const [newest, bestSelling, mostViewed, topDiscount] = await Promise.all([
      this.getNewest(8),
      this.getBestSelling(6),
      this.getMostViewed(8),
      this.getTopDiscount(4),
    ]);

    return { newest, bestSelling, mostViewed, topDiscount };
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.productRepository.findBySlug(slug);
  }

  async filterProducts(
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
    return this.productRepository.findWithFilter(page, limit, filters);
  }
}
