import { CategoryService } from 'src/services/category.service';
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
import { CreateCategoryDto } from 'src/dtos/request/addCategory.dto';
@Controller('/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  async getAllCategory() {
    const categories = await this.categoryService.getAllCategory();

    return Builder<SuccessResponse>()
      .data({ categories })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post()
  @Public()
  async addCategory(@Body() categoryDto: CreateCategoryDto) {
    const category = await this.categoryService.addCategory(categoryDto);

    return Builder<SuccessResponse>()
      .data({ category })
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatusCode.Created)
      .build();
  }

  @Put()
  @Public()
  async updateCategory(@Body() categoryDto: CreateCategoryDto) {
    const category = await this.categoryService.updateCategory(categoryDto);

    return Builder<SuccessResponse>()
      .data({ category })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Patch(':id/inactive')
  @Public()
  async toggleActive(@Param('id') id: number) {
    const category = await this.categoryService.inactiveCategory(id);

    return Builder<SuccessResponse>()
      .data({ category })
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
}
