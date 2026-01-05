import { Controller, Get } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { HttpStatusCode } from 'axios';
import { CategoryService } from 'src/services/category.service';
import { Public } from 'src/utils/auth/public.decorator';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';

@Controller('categories')
export class CategoryClientController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  async getAllCategories() {
    const categories = await this.categoryService.getAllCategory();

    return Builder<SuccessResponse>()
      .data({ categories })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }
}
