import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetailConfiguration } from 'src/entities/other-configuration.entity'; 
import { Configuration } from 'src/entities/configuration.entity'; 

@Injectable()
export class DetailConfigurationRepository {
  constructor(
    @InjectRepository(DetailConfiguration)
    private readonly repository: Repository<DetailConfiguration>,
  ) {}

  /**
   * Tìm DetailConfiguration theo ID
   */
  async findById(id: number): Promise<DetailConfiguration | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Tìm tất cả các DetailConfiguration của một Configuration (thực thể cha)
   */
  async findByConfigurationId(
    configId: number,
  ): Promise<DetailConfiguration[]> {
    return this.repository.find({
      where: { configuration: { id: configId } as Configuration },
    });
  }

  /**
   * Tạo DetailConfiguration mới
   * @param data Dữ liệu value và Configuration (thực thể cha)
   */
  async create(data: {
    value: string;
    configuration: Configuration;
  }): Promise<DetailConfiguration> {
    const detail = this.repository.create(data);
    return this.repository.save(detail);
  }

  /**
   * Tạo nhiều DetailConfiguration cùng lúc
   */
  async createMany(
    dataList: Array<{ value: string; configuration: Configuration }>,
  ): Promise<DetailConfiguration[]> {
    const details = this.repository.create(dataList);
    return this.repository.save(details);
  }

  /**
   * Xóa DetailConfiguration theo ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
