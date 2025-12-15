import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageRepository } from '../repositories/chat-message.repository';
import { ChatMessage } from '../entities/chat-message.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async saveMessage(data: {
    conversationId: string;
    senderId: number;
    content: string;
    imageUrl?: string;
    isAdminReply: boolean;
  }): Promise<ChatMessage> {
    // Verify user exists
    const user = await this.userRepository.findById(data.senderId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.chatMessageRepository.createMessage(data);
  }

  async getConversationHistory(
    conversationId: string,
    limit = 100,
  ): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.getConversationMessages(
      conversationId,
      limit,
    );
  }

  async getAllConversations() {
    return await this.chatMessageRepository.getAllConversations();
  }

  async markAsRead(conversationId: string): Promise<void> {
    await this.chatMessageRepository.markConversationAsRead(conversationId);
  }

  async getConversationDetail(conversationId: string) {
    const messages = await this.getConversationHistory(conversationId);

    if (messages.length === 0) {
      throw new NotFoundException('Conversation not found');
    }

    // Get user info from first message
    const firstMessage = messages[0];
    const user = firstMessage.sender;

    return {
      id: conversationId,
      userId: user.id,
      userName: user.fullName || user.email,
      userEmail: user.email,
      userAvatar: user.avatar,
      messages: messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.sender.fullName || msg.sender.email,
        content: msg.content,
        imageUrl: msg.imageUrl,
        isAdminReply: msg.isAdminReply,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      })),
    };
  }
}
