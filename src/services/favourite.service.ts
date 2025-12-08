import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FavouriteRepository } from '../repositories/favourite.repository';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class FavouriteService {
  private readonly logger = new Logger(FavouriteService.name);

  constructor(
    private readonly favouriteRepository: FavouriteRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getFavourites(userId: number, page: number = 1, limit: number = 12) {
    this.logger.log(
      `Get favourites: userId=${userId}, page=${page}, limit=${limit}`,
    );

    const skip = (page - 1) * limit;
    const favourites = await this.favouriteRepository.findByUserId(
      userId,
      skip,
      limit,
    );
    const total = await this.favouriteRepository.countByUserId(userId);

    return {
      items: favourites.map((fav) => ({
        id: fav.id,
        product: {
          id: fav.product.id,
          productName: fav.product.productName,
          slug: fav.product.slug,
          unitPrice: fav.product.unitPrice,
          originalPrice: fav.product.originalPrice,
          quantityStock: fav.product.quantityStock,
          ratingAvg: fav.product.ratingAvg,
          images: fav.product.images?.map((img) => img.url) || [],
          brand: fav.product.brand
            ? {
                id: fav.product.brand.id,
                brandName: fav.product.brand.brandName,
              }
            : null,
          category: fav.product.category
            ? {
                id: fav.product.category.id,
                categoryName: fav.product.category.categoryName,
              }
            : null,
          discountCampaign: fav.product.discountCampaign
            ? {
                percentage: fav.product.discountCampaign.percentage,
              }
            : null,
        },
        createdAt: fav.createdAt,
      })),
      total,
    };
  }

  async addFavourite(userId: number, productId: number) {
    this.logger.log(`Add favourite: userId=${userId}, productId=${productId}`);

    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Check if already favorited
    const existing = await this.favouriteRepository.findByUserAndProduct(
      userId,
      productId,
    );
    if (existing) {
      throw new BadRequestException('Sản phẩm đã có trong danh sách yêu thích');
    }

    const favourite = await this.favouriteRepository.addFavourite(
      userId,
      productId,
    );

    return {
      success: true,
      message: 'Đã thêm vào danh sách yêu thích',
      favouriteId: favourite.id,
    };
  }

  async removeFavourite(userId: number, productId: number) {
    this.logger.log(
      `Remove favourite: userId=${userId}, productId=${productId}`,
    );

    // Check if exists
    const existing = await this.favouriteRepository.findByUserAndProduct(
      userId,
      productId,
    );
    if (!existing) {
      throw new NotFoundException(
        'Sản phẩm không có trong danh sách yêu thích',
      );
    }

    await this.favouriteRepository.removeFavourite(userId, productId);

    return {
      success: true,
      message: 'Đã xóa khỏi danh sách yêu thích',
    };
  }

  async isFavourite(userId: number, productId: number) {
    const isFav = await this.favouriteRepository.isFavourite(userId, productId);
    return {
      productId,
      isFavourite: isFav,
    };
  }

  async toggleFavourite(userId: number, productId: number) {
    const existing = await this.favouriteRepository.findByUserAndProduct(
      userId,
      productId,
    );

    if (existing) {
      await this.favouriteRepository.removeFavourite(userId, productId);
      return {
        success: true,
        message: 'Đã xóa khỏi danh sách yêu thích',
        isFavourite: false,
      };
    } else {
      // Check if product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      await this.favouriteRepository.addFavourite(userId, productId);
      return {
        success: true,
        message: 'Đã thêm vào danh sách yêu thích',
        isFavourite: true,
      };
    }
  }
}
