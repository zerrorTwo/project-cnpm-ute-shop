import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { BillService } from './bill.service';
import { BrandService } from './brand.service';
import { CategoryService } from './category.service';
import { CartService } from './cart.service';
import { VNPayService } from './vnpay.service';
import { ReviewService } from './review.service';

const Services = [
  AuthService,
  ProductService,
  BillService,
  BrandService,
  CategoryService,
  CartService,
  ReviewService,
];

export const PaymentServices = [VNPayService];

export default Services;
