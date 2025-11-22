import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from '../../dtos/request/addProduct.dto';
import { CloudinaryImageStorage } from '../../cloudinary/cloudinary.storage';
import { ProductService } from '../../services/product.service';
import { Public } from 'src/utils/auth/public.decorator';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import { FilterProductDto } from 'src/dtos/product.dto';

@Controller('/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @Public()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: CloudinaryImageStorage,
    }),
  )
  async createProduct(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const configurations = body.configurations
      ? JSON.parse(body.configurations)
      : [];
    const imageUrls = files.map((file) => file.path);

    const product = await this.productService.createProduct({
      ...body,
      configurations: configurations,
      images: imageUrls,
    });

    return {
      message: 'Tạo sản phẩm thành công',
      product,
    };
  }

  @Get(':id')
  @Public()
  async getProductById(@Param('id') id: number) {
    const product = await this.productService.getDetailProductById(id);

    if (!product) {
      return {
        message: 'Sản phẩm không tồn tại',
        product: null,
      };
    }

    return {
      message: 'Lấy thông tin sản phẩm thành công',
      product,
    };
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number) {
    await this.productService.inactiveProduct(id);
    return {
      message: 'Xóa sản phẩm thành công',
    };
  }

  @Public()
  @Get()
  async filterProducts(@Query() filterDto: FilterProductDto) {
    const { page = 1, limit, ...filters } = filterDto;
    let finalLimit = 10;
    if (limit) {
      finalLimit = limit;
    }
    const { data, total } = await this.productService.findAllProductWithPaging(
      page,
      finalLimit,
      filters,
    );

    const totalPages = Math.ceil(total / finalLimit);

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
}
