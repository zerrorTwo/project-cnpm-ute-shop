import { BrandController } from './brand.controller';
import { CategoryController } from './category.controller';
import { DiscountCampaignController } from './discount-campaign.controller';
import { ProductController } from './product.controller';
import { AdminCommentController } from './comment.controller';
import { AdminReviewController } from './review.controller';
import { DashboardController } from './dashboard.controller';
import { AdminNotificationController } from './notification.controller';
import { ChatController } from './chat.controller';
import { AdminBillController } from './order.controller';
import { UserController } from './user.controller';
import { VoucherController } from './voucher.controller';

const Controllers = [
  ProductController,
  BrandController,
  CategoryController,
  DiscountCampaignController,
  AdminCommentController,
  AdminReviewController,
  DashboardController,
  AdminNotificationController,
  ChatController,
  AdminBillController,
  UserController,
  VoucherController,
];

export default Controllers;
