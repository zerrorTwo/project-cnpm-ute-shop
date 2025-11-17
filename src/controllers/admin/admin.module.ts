import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Services from 'src/services';
import Controllers from '.';
import Repositories from 'src/repositories';
import { User } from 'src/entities/user.entity';
import { Product } from 'src/entities/product.entity';
import { LineItem } from 'src/entities/line-item.entity';
import { DiscountDetail } from 'src/entities/discount-detail.entity';
import { Image } from 'src/entities/image.entity';
import { Comment } from 'src/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Product,
      LineItem,
      DiscountDetail,
      Image,
      Comment,
    ]),
  ],
  controllers: [...Controllers],
  providers: [...Services, ...Repositories],
})
export class AdminModule {}
