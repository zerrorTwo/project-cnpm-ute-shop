import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from '../../dtos/request/addProduct.dto';
import { CloudinaryImageStorage } from '../../cloudinary/cloudinary.storage';
import { ProductService } from '../../services/product.service';
import { Public } from 'src/utils/auth/public.decorator';

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

  @Get()
  @Public()
  async test() {
    return {
      message: 'Tạo sản phẩm thành công',
    };
  }
}
