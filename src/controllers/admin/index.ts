import { BrandController } from './brand.controller';
import { CategoryController } from './category.controller';
import { DiscountCampaignController } from './discount-campaign.controller';
import { ProductController } from './product.controller';
import { AdminCommentController } from './comment.controller';
import { DashboardController } from './dashboard.controller';
import { AdminNotificationController } from './notification.controller';

const Controllers = [
  ProductController,
  BrandController,
  CategoryController,
  DiscountCampaignController,
  AdminCommentController,
  DashboardController,
  AdminNotificationController,
];

export default Controllers;
