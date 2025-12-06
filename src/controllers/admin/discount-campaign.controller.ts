import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  Logger,
  UseGuards,
  HttpException,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DiscountCampaignService } from '../../services/discount-campaign.service';
import { DiscountCampaignDto } from '../../dtos/request/DiscountCampaignDto';
import { SuccessResponse } from 'src/dtos/response.dto';
import { SuccessMessages } from 'src/constants/messages';
import { Builder } from 'builder-pattern';
import { Public } from 'src/utils/auth/public.decorator';
@ApiTags('Discount Campaigns')
@Controller('/discounts')
export class DiscountCampaignController {
  constructor(
    private readonly discountCampaignService: DiscountCampaignService,
  ) {}

  @Post()
  @Public()
  async addDiscountCampaign(@Body() dto: DiscountCampaignDto) {
    const result = await this.discountCampaignService.create(dto);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.CREATE_SUCCESSFULLY)
      .status(HttpStatus.CREATED)
      .build();
  }

  @Put()
  @Public()
  @ApiOperation({
    summary: 'Update discountCampaign',
    description: 'Send a request via this API to update discountCampaign',
  })
  async updateDiscountCampaign(@Body() dto: DiscountCampaignDto) {
    const result = await this.discountCampaignService.create(dto);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.UPDATE_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Delete(':proID')
  @Public()
  async changeStatusDiscountCampaign(
    @Param('proID', ParseIntPipe) proID: number,
  ) {
    const result = await this.discountCampaignService.delete(proID);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.DELETE_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Get()
  @Public()
  async getAllDiscountCampaign(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.discountCampaignService.getAllDiscountCampaign(
      page,
      limit,
    );

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }

  @Get(':id')
  @Public()
  async getDiscountCampaignById(@Param('id', ParseIntPipe) id: number) {
    const result =
      await this.discountCampaignService.getDiscountCampaignDTOById(id);

    return Builder<SuccessResponse>()
      .data(result)
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatus.OK)
      .build();
  }
}
