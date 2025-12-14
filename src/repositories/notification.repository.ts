import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const ent = this.repository.create(data as any);
    const saved = await this.repository.save(ent as any);
    return saved as Notification;
  }

  async findByRecipient(
    recipientId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repository.findAndCount({
      where: { recipient: { id: recipientId } as any },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async markAsRead(id: number) {
    await this.repository.update(id, { isRead: true } as any);
    return this.repository.findOne({ where: { id } });
  }

  async markAllAsRead(recipientId: number) {
    await this.repository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('recipient_id = :recipientId', { recipientId })
      .execute();
  }

  async delete(id: number) {
    const res = await this.repository.delete(id);
    return (res.affected ?? 0) > 0;
  }

  async deleteAll(recipientId: number) {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('recipient_id = :recipientId', { recipientId })
      .execute();
  }
}
