import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favourite } from '../entities/favourite.entity';

@Injectable()
export class FavouriteRepository {
  constructor(
    @InjectRepository(Favourite)
    public readonly repository: Repository<Favourite>,
  ) {}

  async findByUserId(
    userId: number,
    skip: number = 0,
    limit: number = 12,
  ): Promise<Favourite[]> {
    return this.repository.find({
      where: { userId },
      relations: [
        'product',
        'product.images',
        'product.brand',
        'product.category',
        'product.discountCampaign',
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  async countByUserId(userId: number): Promise<number> {
    return this.repository.count({
      where: { userId },
    });
  }

  async findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<Favourite | null> {
    return this.repository.findOne({
      where: { userId, productId },
    });
  }

  async addFavourite(userId: number, productId: number): Promise<Favourite> {
    const favourite = this.repository.create({ userId, productId });
    return this.repository.save(favourite);
  }

  async removeFavourite(userId: number, productId: number): Promise<void> {
    await this.repository.delete({ userId, productId });
  }

  async isFavourite(userId: number, productId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, productId },
    });
    return count > 0;
  }
}
