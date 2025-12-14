import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { NotificationService } from 'src/services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get()
  async list(
    @CurrentUser('id') userId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.notificationService.getNotifications(
      userId,
      +page,
      +limit,
    );
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: number) {
    const updated = await this.notificationService.markAsRead(+id, userId);
    return { data: updated };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('read-all')
  async markAllRead(@CurrentUser('id') userId: number) {
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: number) {
    const ok = await this.notificationService.delete(+id, userId);
    return { success: ok };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete()
  async deleteAll(@CurrentUser('id') userId: number) {
    await this.notificationService.deleteAll(userId);
    return { success: true };
  }
}
