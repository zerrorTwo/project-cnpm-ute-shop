import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayModule } from 'nestjs-vnpay';
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
import { Cart } from 'src/entities/cart.entity';
import { CartItem } from 'src/entities/cart-item.entity';
import { Favourite } from 'src/entities/favourite.entity';
import { Notification } from 'src/entities/notification.entity';
import { NotificationModule } from 'src/notifications.module';

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
      Cart,
      CartItem,
      Favourite,
      Notification,
    ]),
    VnpayModule,
    NotificationModule,
  ],
  controllers: [...Controllers],
  providers: [...Services, ...Repositories],
})
export class AdminModule {}
