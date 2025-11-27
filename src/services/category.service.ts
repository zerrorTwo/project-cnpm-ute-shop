import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from 'src/dtos/request/addCategory.dto';
import { CategoryDto } from 'src/dtos/response/category.dto';
import { Category } from 'src/entities/category.entity';
import { CategoryRepository } from 'src/repositories';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}
  async getAllCategory(): Promise<CategoryDto[]> {
    return this.categoryRepository.findAll();
  }

  async addCategory(categoryDto: CreateCategoryDto): Promise<Category> {
    const existed = await this.categoryRepository.findOne(
      'categoryName',
      categoryDto.categoryName,
    );

    if (existed) {
      throw new BadRequestException('Category already exists');
    }

    const category = new Category();
    category.active = true;
    category.categoryName = categoryDto.categoryName;
    return this.categoryRepository.create(category);
  }

  async updateCategory(categoryDto: CreateCategoryDto): Promise<Category> {
    const existed = await this.categoryRepository.findOne(
      'categoryName',
      categoryDto.categoryName,
    );

    if (existed) {
      throw new BadRequestException('Category already exists');
    }

    const existed2 = await this.categoryRepository.findOne(
      'id',
      categoryDto.categoryId,
    );

    if (!existed2) {
      throw new BadRequestException('Category is not exists');
    }

    existed2.categoryName = categoryDto.categoryName;
    return this.categoryRepository.create(existed2);
  }

  async inactiveCategory(id: number) {
    const existed2 = await this.categoryRepository.findOne('id', id);

    if (!existed2) {
      throw new BadRequestException('Category is not exists');
    }

    existed2.active = !existed2.active;
    return this.categoryRepository.create(existed2);
  }
}
