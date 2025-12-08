import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavouriteService } from '../../services/favourite.service';
import { AuthGuard } from '../../utils/auth/auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { Builder } from 'builder-pattern';
import { SuccessResponse } from '../../dtos/response.dto';
import { SuccessMessages } from '../../constants/messages';
import { HttpStatusCode } from 'axios';

@Controller('favourites')
@UseGuards(AuthGuard)
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @Get()
  async getFavourites(
    @CurrentUser('id') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ) {
    const { items, total } = await this.favouriteService.getFavourites(
      userId,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return Builder<SuccessResponse>()
      .data({
        data: items,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
        },
      })
      .message(SuccessMessages.GET_SUCCESSFULLY)
      .status(HttpStatusCode.Ok)
      .build();
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  async addFavourite(
    @CurrentUser('id') userId: number,
    @Param('productId') productId: string,
  ) {
    console.log(userId);

    return this.favouriteService.addFavourite(userId, parseInt(productId, 10));
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  async removeFavourite(
    @CurrentUser('id') userId: number,
    @Param('productId') productId: string,
  ) {
    return this.favouriteService.removeFavourite(
      userId,
      parseInt(productId, 10),
    );
  }

  @Get('check/:productId')
  async isFavourite(
    @CurrentUser('id') userId: number,
    @Param('productId') productId: string,
  ) {
    return this.favouriteService.isFavourite(userId, parseInt(productId, 10));
  }

  @Post('toggle/:productId')
  @HttpCode(HttpStatus.OK)
  async toggleFavourite(
    @CurrentUser('id') userId: number,
    @Param('productId') productId: string,
  ) {
    return this.favouriteService.toggleFavourite(
      userId,
      parseInt(productId, 10),
    );
  }
}
