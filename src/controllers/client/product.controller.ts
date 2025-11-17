import { Controller, Get } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { HttpStatusCode } from 'axios';
import { Public } from '../../utils/auth/public.decorator';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { ProductService } from '../../services/product.service';

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
}
