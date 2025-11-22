import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProductRepository } from 'src/repositories/product.repository';
import { Product } from 'src/entities/product.entity';
import { CreateProductDto } from 'src/dtos/request/addProduct.dto';
import { BrandRepository } from 'src/repositories/brand.repository';
import { CategoryRepository } from 'src/repositories/category.repository';
import { ImageRepository } from 'src/repositories/image.repository';
import { ConfigurationRepository } from 'src/repositories/configuration.repository';
import { DetailConfigurationRepository } from 'src/repositories/detail-configuration.repository';
import { Brand } from 'src/entities/brand.entity';
import { Category } from 'src/entities/category.entity';
import { Configuration } from 'src/entities/configuration.entity';
import { DetailConfiguration } from 'src/entities/other-configuration.entity';
import { Image } from 'src/entities/image.entity';

export interface CreateProductPayload extends CreateProductDto {}
@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly imageRepository: ImageRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly detailConfigurationRepository: DetailConfigurationRepository,
  ) {}

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

  async getDetailProductById(id: number): Promise<Product | null> {
    return this.productRepository.findDetailById(id);
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  // src/services/product.service.ts

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const {
      productName,
      brandId,
      categoryId,
      images,
      configurations,
      ...productData
    } = payload;

    const queryRunner =
      this.productRepository.repository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const slug = this.generateSlug(productName);
      const existingProduct = await queryRunner.manager.findOne(Product, {
        where: { slug },
      });

      if (existingProduct) {
        throw new InternalServerErrorException(
          'Tên sản phẩm đã tồn tại, vui lòng chọn tên khác.',
        );
      }

      const brand = await queryRunner.manager.findOne(Brand, {
        where: { id: brandId },
      });
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });

      if (!brand || !category) {
        throw new InternalServerErrorException(
          'Brand hoặc Category không tồn tại.',
        );
      }

      const newProduct = queryRunner.manager.create(Product, {
        ...productData,
        productName,
        slug,
        brand,
        category,
      });

      newProduct.displayStatus = true;
      newProduct.views = 0;
      newProduct.ratingAvg = 0;
      const savedProduct = await queryRunner.manager.save(newProduct);

      if (images && images.length > 0) {
        const imageEntities = images.map((url) =>
          queryRunner.manager.create(Image, { url }),
        );
        savedProduct.images = imageEntities;
      }

      if (configurations && configurations.length > 0) {
        const configurationsSaved: Configuration[] = [];

        for (const configPayload of configurations) {
          const newConfigurationEntity = queryRunner.manager.create(
            Configuration,
            {
              product: savedProduct,
              name: configPayload.name,
            },
          );
          const savedConfiguration = await queryRunner.manager.save(
            newConfigurationEntity,
          );

          const detailPlainObjects = configPayload.detail.map(
            (detailValue) => ({
              value: `${detailValue}`,
              configuration: savedConfiguration,
            }),
          );

          const newDetailEntities = queryRunner.manager.create(
            DetailConfiguration,
            detailPlainObjects,
          );
          await queryRunner.manager.save(newDetailEntities);

          configurationsSaved.push(savedConfiguration);
        }

        savedProduct.configurations = configurationsSaved;
      }

      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();

      const productId = savedProduct.id;
      const finalProduct = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        relations: [
          'brand',
          'category',
          'images',
          'configurations',
          'configurations.otherConfigs',
        ],
      });

      if (!finalProduct) {
        throw new InternalServerErrorException(
          'Không tìm thấy sản phẩm vừa tạo.',
        );
      }

      return finalProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Lỗi khi tạo sản phẩm:', error);
      throw new InternalServerErrorException(
        error.message || 'Không thể tạo sản phẩm',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async inactiveProduct(id: number, limit: number = 10): Promise<string> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new Error(`Sản phẩm với ID ${id} không tồn tại.`);
    }
    product.displayStatus = !product.displayStatus;
    await this.productRepository.repository.save(product);
    return 'Success';
  }

  async findAllProductWithPaging(
    page: number,
    limit: number,
    filters: {
      search?: string;
      categoryId?: number;
      brandId?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ data: Product[]; total: number }> {
    return this.productRepository.findAllProductWithPaging(
      page,
      limit,
      filters,
    );
  }
}
