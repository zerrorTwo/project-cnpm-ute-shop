import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { NotificationService } from 'src/services/notification.service';
import { CreateNotificationEventDto } from 'src/dtos/notification.dto';

@ApiTags('Admin - Notifications')
@Controller('notifications')
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('create-event')
  @ApiBody({
    type: CreateNotificationEventDto,
    examples: {
      singleUser: {
        value: {
          title: 'Thông báo đặc biệt',
          description: 'Nội dung thông báo',
          type: 'EVENT',
          recipientId: 1,
          url: '/path',
        },
      },
      multipleUsers: {
        value: {
          title: 'Thông báo cho nhiều người',
          description: 'Nội dung thông báo',
          type: 'EVENT',
          recipientIds: [1, 2, 3],
          url: '/path',
        },
      },
      allUsers: {
        value: {
          title: 'Thông báo cho tất cả',
          description: 'Nội dung thông báo',
          type: 'EVENT',
          sendToAll: true,
          url: '/path',
        },
      },
    },
  })
  async createNotificationEvent(
    @Body() createEventDto: CreateNotificationEventDto,
  ) {
    const result = await this.notificationService.createNotificationEvent({
      recipientId: createEventDto.recipientId,
      recipientIds: createEventDto.recipientIds,
      sendToAll: createEventDto.sendToAll,
      title: createEventDto.title,
      description: createEventDto.description,
      type: createEventDto.type,
      url: createEventDto.url,
      scheduledAt: createEventDto.scheduledAt,
    });
    return {
      success: true,
      data: result,
      message: `Tạo thông báo cho ${result.count} người dùng thành công`,
    };
  }
}
