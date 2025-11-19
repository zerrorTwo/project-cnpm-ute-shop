import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Controllers from '.';
import Services from 'src/services';
import Repositories from 'src/repositories';
import { User } from 'src/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { MailModule } from 'src/mail/mail.module';
import { GoogleStrategy } from 'src/controllers/client/google.strategy';
import { Product } from 'src/entities/product.entity';
import { LineItem } from 'src/entities/line-item.entity';
import { DiscountDetail } from 'src/entities/discount-detail.entity';
import { Image } from 'src/entities/image.entity';
import { Comment } from 'src/entities/comment.entity';
import { Bill } from 'src/entities/bill.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Product,
      LineItem,
      DiscountDetail,
      Image,
      Comment,
      Bill,
    ]),
    MailModule,
  ],
  controllers: [...Controllers],
  providers: [
    ...Services,
    ...Repositories,
    AuthService,
    AuthGuard,
    GoogleStrategy,
  ],
})
export class ClientModule {}
