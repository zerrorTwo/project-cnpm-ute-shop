import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from './entities/user.entity';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { UserRepository } from './repositories/user.repository';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, User]),
    CloudinaryModule,
    RedisModule,
  ],
  providers: [ChatMessageRepository, UserRepository, ChatService, ChatGateway],
  exports: [ChatService, ChatGateway, ChatMessageRepository],
})
export class SharedModule {}
