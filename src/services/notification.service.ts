import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { NotificationRepository } from 'src/repositories/notification.repository';
import {
  Notification,
  ENotificationType,
} from 'src/entities/notification.entity';
import { NotificationGateway } from 'src/gateways/notification.gateway';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly userRepository: UserRepository,
  ) {}

  async createNotification(payload: {
    recipientId: number;
    title: string;
    description?: string;
    type?: ENotificationType;
    url?: string;
  }) {
    const { recipientId, title, description, type, url } = payload;

    const saved = await this.notificationRepository.create({
      title,
      description,
      type: type || ENotificationType.EVENT,
      recipient: { id: recipientId } as any,
      url,
    } as Partial<Notification>);

    try {
      this.notificationGateway.sendToUser(recipientId, saved);
    } catch (err) {
      this.logger.warn('Failed to send realtime notification: ' + err?.message);
    }

    return saved;
  }

  async getNotifications(recipientId: number, page = 1, limit = 20) {
    return this.notificationRepository.findByRecipient(
      recipientId,
      page,
      limit,
    );
  }

  async markAsRead(id: number, recipientId: number) {
    // Optionally validate recipient ownership in repository layer
    const updated = await this.notificationRepository.markAsRead(id);
    return updated;
  }

  async markAllAsRead(recipientId: number) {
    await this.notificationRepository.markAllAsRead(recipientId);
  }

  async delete(id: number, recipientId: number) {
    return this.notificationRepository.delete(id);
  }

  async deleteAll(recipientId: number) {
    return this.notificationRepository.deleteAll(recipientId);
  }

  async createNotificationEvent(payload: {
    recipientId?: number;
    recipientIds?: number[];
    sendToAll?: boolean;
    title: string;
    description: string;
    type: ENotificationType;
    url?: string;
    scheduledAt?: string;
  }) {
    const {
      title,
      description,
      type,
      url,
      scheduledAt,
      recipientId,
      recipientIds,
      sendToAll,
    } = payload;

    let userIds: number[] = [];

    if (sendToAll) {
      // Get all users
      const users = await this.userRepository.findAll(1, 10000);
      userIds = users.data.map((u) => u.id);
    } else if (recipientIds && recipientIds.length > 0) {
      // Multiple users
      userIds = recipientIds;
    } else if (recipientId) {
      // Single user
      userIds = [recipientId];
    } else {
      throw new BadRequestException(
        'Phải chỉ định recipientId hoặc recipientIds hoặc sendToAll',
      );
    }

    const savedNotifications: Notification[] = [];

    for (const userId of userIds) {
      const saved = await this.notificationRepository.create({
        title,
        description,
        type,
        recipient: { id: userId } as any,
        url,
      } as Partial<Notification>);

      savedNotifications.push(saved);

      try {
        this.notificationGateway.sendToUser(userId, saved);
      } catch (err) {
        this.logger.warn(
          `Failed to send realtime notification to user ${userId}: ${err?.message}`,
        );
      }
    }

    return {
      success: true,
      count: savedNotifications.length,
      notifications: savedNotifications,
    };
  }
}
