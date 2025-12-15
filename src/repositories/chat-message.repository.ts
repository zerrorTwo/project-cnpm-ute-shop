import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repository: Repository<ChatMessage>,
  ) {}

  async createMessage(data: {
    conversationId: string;
    senderId: number;
    content: string;
    imageUrl?: string;
    isAdminReply: boolean;
  }): Promise<ChatMessage> {
    const message = this.repository.create(data);
    return await this.repository.save(message);
  }

  async getConversationMessages(
    conversationId: string,
    limit = 100,
  ): Promise<ChatMessage[]> {
    return await this.repository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async getAllConversations(): Promise<
    Array<{
      conversationId: string;
      userId: number;
      userName: string;
      userEmail: string;
      userAvatar: string;
      lastMessageContent: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>
  > {
    const query = `
      SELECT 
        cm.conversationId,
        u.id as userId,
        u.fullName as userName,
        u.email as userEmail,
        u.avatar as userAvatar,
        (SELECT content FROM chat_messages WHERE conversationId = cm.conversationId ORDER BY createdAt DESC LIMIT 1) as lastMessageContent,
        (SELECT createdAt FROM chat_messages WHERE conversationId = cm.conversationId ORDER BY createdAt DESC LIMIT 1) as lastMessageAt,
        (SELECT COUNT(*) FROM chat_messages WHERE conversationId = cm.conversationId AND isAdminReply = 0 AND isRead = 0) as unreadCount
      FROM chat_messages cm
      INNER JOIN users u ON cm.senderId = u.id
      WHERE cm.isAdminReply = 0
      GROUP BY cm.conversationId, u.id, u.fullName, u.email, u.avatar
      ORDER BY lastMessageAt DESC
    `;

    return await this.repository.query(query);
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.repository.update(
      { conversationId, isAdminReply: false },
      { isRead: true },
    );
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    return await this.repository.count({
      where: { conversationId, isAdminReply: false, isRead: false },
    });
  }
}
