import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBrandDto } from 'src/dtos/request/addBrand.dto';
import { BrandDto } from 'src/dtos/response/brand.dto';
import { Brand } from 'src/entities/brand.entity';
import { BrandRepository } from 'src/repositories/brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}
  async getAllBrand(): Promise<BrandDto[]> {
    return this.brandRepository.findAll();
  }

  async addBrand(brandDto: CreateBrandDto): Promise<Brand> {
    const existed = await this.brandRepository.findOne(
      'brandName',
      brandDto.brandName,
    );

    if (existed) {
      throw new BadRequestException('Brand already exists');
    }

    const brand = new Brand();
    brand.active = true;
    brand.brandName = brandDto.brandName;
    return this.brandRepository.create(brand);
  }

  async updateBrand(brandDto: CreateBrandDto): Promise<Brand> {
    const existed = await this.brandRepository.findOne(
      'brandName',
      brandDto.brandName,
    );

    if (existed) {
      throw new BadRequestException('Brand already exists');
    }

    const existed2 = await this.brandRepository.findOne('id', brandDto.brandId);

    if (!existed2) {
      throw new BadRequestException('Brand is not exists');
    }

    existed2.brandName = brandDto.brandName;
    return this.brandRepository.create(existed2);
  }

  async inactiveBrand(id: number) {
    const existed2 = await this.brandRepository.findOne('id', id);

    if (!existed2) {
      throw new BadRequestException('Brand is not exists');
    }

    existed2.active = !existed2.active;
    return this.brandRepository.create(existed2);
  }
}
