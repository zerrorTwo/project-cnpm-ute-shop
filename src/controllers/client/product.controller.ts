import { Controller, Get, Param, Query } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { HttpStatusCode } from 'axios';
import { Public } from '../../utils/auth/public.decorator';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { ProductService } from '../../services/product.service';
import { FilterProductDto } from '../../dtos/product.dto';

@Controller('home')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Public()
  @Get('newest')
  async getNewest() {
    const data = await this.productService.getNewest(8);

    return Builder<SuccessResponse>()
      .data(data)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('best-selling')
  async getBestSelling() {
    const data = await this.productService.getBestSelling(6);

    return Builder<SuccessResponse>()
      .data(data)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('most-viewed')
  async getMostViewed() {
    const data = await this.productService.getMostViewed(4);

    return Builder<SuccessResponse>()
      .data(data)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('top-discount')
  async getTopDiscount() {
    const data = await this.productService.getTopDiscount(4);

    return Builder<SuccessResponse>()
      .data(data)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('products')
  async getHomeProducts() {
    const result = await this.productService.getHomeProducts();

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('products/filter')
  async filterProducts(@Query() filterDto: FilterProductDto) {
    const { page = 1, limit = 12, ...filters } = filterDto;

    const { data, total } = await this.productService.filterProducts(
      page,
      limit,
      filters,
    );

    const totalPages = Math.ceil(total / limit);

    return Builder<SuccessResponse>()
      .data({
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Public()
  @Get('products/:slug')
  async getProductDetail(@Param('slug') slug: string) {
    const product = await this.productService.getProductBySlug(slug);

    if (!product) {
      return Builder<SuccessResponse>()
        .data(null)
        .message('Product not found')
        .status(HttpStatusCode.NotFound)
        .build();
    }

    return Builder<SuccessResponse>()
      .data(product)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
}
