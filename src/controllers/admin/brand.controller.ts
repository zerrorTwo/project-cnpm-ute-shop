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
  Patch,
} from '@nestjs/common';

import { Public } from 'src/utils/auth/public.decorator';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { HttpStatusCode } from 'axios';
import { Builder } from 'builder-pattern';
import { FilterProductDto } from 'src/dtos/product.dto';
import { BrandService } from 'src/services/brand.service';
import { CreateBrandDto } from 'src/dtos/request/addBrand.dto';

@Controller('/brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @Get()
  async getAllBrands() {
    const brands = await this.brandService.getAllBrand();

    return Builder<SuccessResponse>()
      .data({ brands })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }


  @Post()
  async addBrand(@Body() brandDto: CreateBrandDto) {
    const brand = await this.brandService.addBrand(brandDto);

    return Builder<SuccessResponse>()
      .data({ brand })
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Created)
      .build();
  }


  @Put()
  async updateBrand(@Body() brandDto: CreateBrandDto) {

    const brand = await this.brandService.updateBrand(brandDto);

    return Builder<SuccessResponse>()
      .data({ brand })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Patch(':id/inactive')
  async toggleActive(@Param('id') id: number) {
    const brand = await this.brandService.inactiveBrand(id);

    return Builder<SuccessResponse>()
      .data({ brand })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
}
