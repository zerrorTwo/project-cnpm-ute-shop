import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Services from 'src/services';
import Controllers from '.';
import Repositories from 'src/repositories';
import { User } from 'src/entities/user.entity';
import { Product } from 'src/entities/product.entity';
import { LineItem } from 'src/entities/line-item.entity';
import { DiscountCampaign } from 'src/entities/discount-campaign.entity';
import { Image } from 'src/entities/image.entity';
import { Comment } from 'src/entities/comment.entity';
import { Bill } from 'src/entities/bill.entity';
import { Category } from 'src/entities/category.entity';
import { Brand } from 'src/entities/brand.entity';
import { Configuration } from 'src/entities/configuration.entity';
import { DetailConfiguration } from 'src/entities/other-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Product,
      LineItem,
      DiscountCampaign,
      Image,
      Comment,
      Bill,
      Brand,
      Category,
      Configuration,
      DetailConfiguration,
    ]),
  ],
  controllers: [...Controllers],
  providers: [...Services, ...Repositories],
})
export class AdminModule {}
