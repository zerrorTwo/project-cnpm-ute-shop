import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from 'src/services/chat.service';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get conversation history for current user
  @Get('my-conversation')
  async getMyConversation(@CurrentUser() user: any) {
    const conversationId = `user-${user.id}`;

    try {
      const conversation =
        await this.chatService.getConversationDetail(conversationId);
      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      // Return empty conversation if not found
      return {
        success: true,
        data: {
          id: conversationId,
          userId: user.id,
          userName: user.fullName || user.email,
          userEmail: user.email,
          userAvatar: user.avatar,
          messages: [],
        },
      };
    }
  }

  // Get conversation history by ID (for loading old messages)
  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    // Verify user can only access their own conversation
    const userConversationId = `user-${user.id}`;
    if (conversationId !== userConversationId) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    const messages =
      await this.chatService.getConversationHistory(conversationId);

    return {
      success: true,
      data: messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.sender?.fullName || msg.sender?.email || 'User',
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
