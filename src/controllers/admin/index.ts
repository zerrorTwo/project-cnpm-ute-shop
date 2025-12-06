import { BrandController } from './brand.controller';
import { CategoryController } from './category.module';
import { DiscountCampaignController } from './discount-campaign.controller';
import { ProductController } from './product.controller';

const Controllers = [
  ProductController,
  BrandController,
  CategoryController,
  DiscountCampaignController,
];

export default Controllers;
