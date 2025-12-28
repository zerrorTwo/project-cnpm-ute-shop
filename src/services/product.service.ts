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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from 'src/entities/bill.entity';

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
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
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
    const product = await this.productRepository.findDetailById(id);

    if (product) {
      // Increment views counter
      await this.productRepository.repository.increment({ id }, 'views', 1);
    }

    return product;
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

  async updateProduct(payload: CreateProductDto): Promise<Product> {
    const {
      productId,
      productName,
      brandId,
      categoryId,
      oldImages,
      images,
      configurations,
      ...productData
    } = payload;

    const queryRunner =
      this.productRepository.repository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        relations: [
          'brand',
          'category',
          'images',
          'configurations',
          'configurations.otherConfigs',
        ],
      });

      if (!product) {
        throw new InternalServerErrorException('Sản phẩm không tồn tại');
      }

      let slug = product.slug;
      if (productName && productName !== product.productName) {
        slug = this.generateSlug(productName);

        const existed = await queryRunner.manager.findOne(Product, {
          where: { slug },
        });

        if (existed && existed.id !== productId) {
          throw new InternalServerErrorException(
            'Tên sản phẩm đã tồn tại, vui lòng chọn tên khác.',
          );
        }
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

      queryRunner.manager.merge(Product, product, {
        ...productData,
        productName,
        slug,
        brand,
        category,
      });

      const savedProduct = await queryRunner.manager.save(product);

      if (images || oldImages) {
        const existingImages = await queryRunner.manager.find(Image, {
          where: { product: { id: productId } },
        });

        const imagesToKeep = existingImages.filter((img) =>
          oldImages.includes(img.url),
        );

        const imagesToDelete = existingImages.filter(
          (img) => !oldImages.includes(img.url),
        );

        if (imagesToDelete.length > 0) {
          const idsToDelete = imagesToDelete.map((img) => img.id);
          await queryRunner.manager.delete(Image, idsToDelete);
        }

        let newImageEntities: Image[] = [];

        if (images && images.length > 0) {
          newImageEntities = images.map((url) =>
            queryRunner.manager.create(Image, { url, product: savedProduct }),
          );

          await queryRunner.manager.save(newImageEntities);
        }

        savedProduct.images = [...imagesToKeep, ...newImageEntities];
      }

      if (configurations) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(DetailConfiguration)
          .where(
            'configuration_id IN (SELECT id FROM configurations WHERE productId = :productId)',
            { productId },
          )
          .execute();

        await queryRunner.manager.delete(Configuration, {
          product: { id: productId },
        });

        const newConfigs: Configuration[] = [];

        for (const configPayload of configurations) {
          const newConfig = queryRunner.manager.create(Configuration, {
            product: savedProduct,
            name: configPayload.name,
          });

          const savedConfig = await queryRunner.manager.save(newConfig);

          const detailsPlainObject = configPayload.detail.map((value) => ({
            value: `${value}`,
            configuration: savedConfig,
          }));

          const detailEntities = queryRunner.manager.create(
            DetailConfiguration,
            detailsPlainObject,
          );

          await queryRunner.manager.save(detailEntities);

          newConfigs.push(savedConfig);
        }

        savedProduct.configurations = newConfigs;
      }

      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();

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
      console.error('Lỗi khi update sản phẩm:', error);
      throw new InternalServerErrorException(
        error.message || 'Không thể cập nhật sản phẩm',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get similar products based on category, price range, and brand
   */
  async getSimilarProducts(
    productId: number,
    limit: number = 6,
  ): Promise<Product[]> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return [];
    }

    const minPrice = product.unitPrice * 0.7; // -30%
    const maxPrice = product.unitPrice * 1.3; // +30%

    const queryBuilder = this.productRepository.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.discountCampaign', 'discountCampaign')
      .where('product.id != :productId', { productId })
      .andWhere('product.displayStatus = :displayStatus', {
        displayStatus: true,
      })
      .andWhere('product.category.id = :categoryId', {
        categoryId: product.category.id,
      });

    // Optional: prioritize same brand
    queryBuilder
      .addSelect(
        `CASE WHEN product.brand.id = :brandId THEN 0 ELSE 1 END`,
        'brand_priority',
      )
      .setParameter('brandId', product.brand?.id || 0)
      .addOrderBy('brand_priority', 'ASC');

    queryBuilder
      .andWhere('product.unitPrice BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      })
      .orderBy('product.views', 'DESC')
      .limit(limit);

    return queryBuilder.getMany();
  }

  /**
   * Get count of unique customers who purchased this product
   */
  async getCustomerPurchaseCount(productId: number): Promise<number> {
    const result = await this.billRepository
      .createQueryBuilder('bill')
      .innerJoin('bill.items', 'lineItem')
      .where('lineItem.product.id = :productId', { productId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'SHIPPING'],
      })
      .select('COUNT(DISTINCT bill.user_id)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async getQuantityOfProduct(): Promise<number> {
    const result = await this.productRepository.getTotalProductQuantity();
    return result;
  }
}
