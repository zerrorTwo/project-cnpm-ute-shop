import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { DiscountCampaign } from '../entities/discount-campaign.entity';
import { Product } from '../entities/product.entity';
import { DiscountCampaignDto } from '../dtos/request/DiscountCampaignDto';
import { PaginatedResult } from 'src/dtos/response/PaginatedResult';

@Injectable()
export class DiscountCampaignService {
  constructor(
    @InjectRepository(DiscountCampaign)
    private readonly campaignRepository: Repository<DiscountCampaign>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: DiscountCampaignDto): Promise<string> {
    let campaign: DiscountCampaign | null;

    if (dto.id && dto.id !== 0) {
      campaign = await this.campaignRepository.findOne({
        where: { id: dto.id },
        relations: ['products'],
      });
      if (!campaign) throw new NotFoundException('Configuration not found');
    } else {
      campaign = new DiscountCampaign();
    }

    campaign.name = dto.name;
    campaign.description = dto.description;
    campaign.percentage = dto.percentage;
    campaign.active = true;
    campaign.startDate = new Date(dto.startDate);
    campaign.endDate = new Date(dto.endDate);

    if (dto.productIDs && dto.productIDs.length > 0) {
      const products = await this.productRepository.find({
        where: { id: In(dto.productIDs) },
      });

      campaign.products = products;
      console.log(products);
    } else {
      campaign.products = [];
    }

    const savedCampaign = await this.campaignRepository.save(campaign);

    return savedCampaign.name;
  }

  async delete(id: number): Promise<string> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!campaign) throw new NotFoundException('Not found');

    campaign.active = !campaign.active;

    if (!campaign.active) {
      campaign.products = [];
    }

    await this.campaignRepository.save(campaign);
    return campaign.name;
  }

  async getDiscountCampaignDTOById(id: number): Promise<DiscountCampaignDto> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!campaign) throw new NotFoundException('Not Found');

    return this.toCampaignDto(campaign);
  }

  async getAllDiscountCampaign(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<DiscountCampaignDto>> {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await this.campaignRepository.findAndCount({
      relations: ['products'],
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' },
    });

    const data = campaigns.map((campaign) => this.toCampaignDto(campaign));

    return {
      data: data,
      meta: {
        total: total,
        page: page,
        limit: limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  private toCampaignDto(campaign: DiscountCampaign): DiscountCampaignDto {
    const dto = new DiscountCampaignDto();

    dto.id = campaign.id;
    dto.name = campaign.name;
    dto.description = campaign.description;
    dto.percentage = campaign.percentage;
    dto.active = campaign.active;

    dto.startDate = campaign.startDate
      ? campaign.startDate.toISOString().split('T')[0]
      : '';

    dto.endDate = campaign.endDate
      ? campaign.endDate.toISOString().split('T')[0]
      : '';

    // Map Product IDs
    if (campaign.products) {
      dto.productIDs = campaign.products.map((p) => p.id);
    } else {
      dto.productIDs = [];
    }

    return dto;
  }
}
