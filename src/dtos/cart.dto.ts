import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CartItemResponseDto {
  id: number;
  quantity: number;
  product: {
    id: number;
    productName: string;
    slug: string;
    unitPrice: number;
    quantityStock: number;
    images: Array<{ id: number; url: string }>;
    discountCampaign?: {
      percentage: number;
    };
  };
  itemTotal: number;
}

export class CartResponseDto {
  id: number;
  items: CartItemResponseDto[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
