// src/repositories/index.ts

import { UserRepository } from './user.repository';
import { ProductRepository } from './product.repository';
import { BillRepository } from './bill.repository';
import { BrandRepository } from './brand.repository';
import { CategoryRepository } from './category.repository';
import { ImageRepository } from './image.repository';
import { ConfigurationRepository } from './configuration.repository';
import { DetailConfigurationRepository } from './detail-configuration.repository';
import { CartRepository } from './cart.repository';
import { PaymentRepository } from './payment.repository';
import { VoucherRepository } from './voucher.repository';
import { LoyaltyPointRepository } from './loyalty-point.repository';
import { CommentRepository } from './comment.repository';
import { FavouriteRepository } from './favourite.repository';
import { LineItem } from 'src/entities/line-item.entity';
import { LineItemRepository } from './line-item.repository';
import { SerialProductRepository } from './serial-product.repository';
import { NotificationRepository } from './notification.repository';

const Repositories = [
  UserRepository,
  ProductRepository,
  BillRepository,
  BrandRepository,
  CategoryRepository,
  ImageRepository,
  ConfigurationRepository,
  DetailConfigurationRepository,
  CartRepository,
  PaymentRepository,
  VoucherRepository,
  LoyaltyPointRepository,
  CommentRepository,
  FavouriteRepository,
  LineItemRepository,
  SerialProductRepository,
  NotificationRepository,
];

export {
  UserRepository,
  ProductRepository,
  BillRepository,
  BrandRepository,
  CategoryRepository,
  ImageRepository,
  ConfigurationRepository,
  DetailConfigurationRepository,
  CartRepository,
  PaymentRepository,
  VoucherRepository,
  LoyaltyPointRepository,
  CommentRepository,
  FavouriteRepository,
  LineItemRepository,
  SerialProductRepository,
  NotificationRepository,
};

export default Repositories;
