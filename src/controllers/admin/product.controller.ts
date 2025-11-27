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
  Put,
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
    return Builder<SuccessResponse>()
      .data({
        product,
      })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Put()
  @Public()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: CloudinaryImageStorage,
    }),
  )
  async updateProduct(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const configurations = body.configurations
      ? JSON.parse(body.configurations)
      : [];
    const imageUrls = files.map((file) => file.path);

    const product = await this.productService.updateProduct({
      ...body,
      configurations: configurations,
      images: imageUrls,
    });
    return Builder<SuccessResponse>()
      .data({
        product,
      })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }


  @Get(':id')
  @Public()
  async getProductById(@Param('id') id: number) {
    const product = await this.productService.getDetailProductById(id);

    if (!product) {
      return Builder<SuccessResponse>()
        .data({
          product,
        })
        .message('Không tìm thấy sản phẩm')
        .status(HttpStatusCode.Ok)
        .build();
    }

    return Builder<SuccessResponse>()
      .data({
        product,
      })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
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
    const { page = 1, limit = 12, ...filters } = filterDto;
    const { data, total } = await this.productService.findAllProductWithPaging(
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
}
