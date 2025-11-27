import { EProductStatus } from 'src/entities/product.entity';

export class CreateProductDto {
  productId?: number;
  productName: string;
  brandId: number;
  categoryId: number;
  description: string;
  originalPrice: number;
  unitPrice: number;
  productStatus: EProductStatus;
  quantityStock: number;
  images: string[];
  oldImages: string[];
  configurations?: ConfigurationProduct[];
}

export class ConfigurationProduct {
  name: string;
  detail: string[];
}
