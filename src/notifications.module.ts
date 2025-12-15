import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { User } from './entities';
import { UserRepository } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  providers: [
    NotificationRepository,
    NotificationService,
    NotificationGateway,
    UserRepository,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
