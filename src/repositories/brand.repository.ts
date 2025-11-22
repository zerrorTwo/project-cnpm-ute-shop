import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from 'src/entities/brand.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly repository: Repository<Brand>,
  ) {}

  /**
   * Tìm bill theo ID
   */
  async findById(id: number): Promise<Brand | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<Brand>): Promise<Brand> {
    const brand = this.repository.create(data);
    return this.repository.save(brand);
  }

  async update(id: number, data: Partial<Brand>): Promise<Brand | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
  async findAll(): Promise<Brand[]> {
      return this.repository.find();
    }
}
