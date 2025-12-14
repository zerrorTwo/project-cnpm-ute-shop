import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { NotificationGateway } from './gateways/notification.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationRepository, NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
