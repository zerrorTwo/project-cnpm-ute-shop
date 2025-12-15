import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { BillService } from './bill.service';
import { BrandService } from './brand.service';
import { CategoryService } from './category.service';

import { DiscountCampaignService } from './discount-campaign.service';

import { CartService } from './cart.service';
import { VNPayService } from './vnpay.service';
import { ReviewService } from './review.service';
import { CommentService } from './comment.service';
import { FavouriteService } from './favourite.service';
import { NotificationService } from './notification.service';
import { ChatService } from './chat.service';

const Services = [
  AuthService,
  ProductService,
  BillService,
  BrandService,
  CategoryService,
  DiscountCampaignService,
  CartService,
  ReviewService,
  CommentService,
  FavouriteService,
  NotificationService,
  ChatService,
];

export const PaymentServices = [VNPayService];

export default Services;
