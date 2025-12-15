import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';

interface SendMessagePayload {
  conversationId: string;
  senderId: number;
  content: string;
  imageUrl?: string;
  isAdminReply: boolean;
}

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    try {
      const query = client.handshake.query as any;
      const userId = query?.userId;
      const isAdmin = query?.isAdmin === 'true';

      if (userId) {
        if (isAdmin) {
          // Admin joins admin room to receive all messages
          client.join('admin-room');
          this.logger.log(`Admin ${userId} joined admin-room`);
        } else {
          // User joins their own conversation room
          const conversationId = `user-${userId}`;
          client.join(conversationId);
          this.logger.log(`User ${userId} joined ${conversationId}`);
        }
      } else {
        this.logger.log(`Socket ${client.id} connected without userId`);
      }
    } catch (err) {
      this.logger.warn('Error on connection: ' + err?.message);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.conversationId);
    this.logger.log(`Socket ${client.id} joined ${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Save message to database
      const message = await this.chatService.saveMessage({
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        content: payload.content,
        imageUrl: payload.imageUrl,
        isAdminReply: payload.isAdminReply,
      });

      // Prepare message data
      const messageData = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender?.fullName || message.sender?.email || 'User',
        content: message.content,
        imageUrl: message.imageUrl,
        isAdminReply: message.isAdminReply,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      };

      // Emit to the conversation room (user)
      this.server.to(payload.conversationId).emit('new_message', messageData);

      // Emit to all admins
      this.server.to('admin-room').emit('new_message', messageData);

      this.logger.log(
        `Message sent to ${payload.conversationId} and admin-room`,
      );

      // Acknowledge to sender
      return { success: true, message: messageData };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: TypingPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast typing status to conversation and admins
    client.to(payload.conversationId).emit('user_typing', payload);
    client.to('admin-room').emit('user_typing', payload);
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.markAsRead(data.conversationId);
      this.server
        .to(data.conversationId)
        .emit('messages_read', { conversationId: data.conversationId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to send notification to specific user
  sendToUser(conversationId: string, event: string, payload: any) {
    this.server.to(conversationId).emit(event, payload);
  }

  // Method to send notification to all admins
  sendToAdmins(event: string, payload: any) {
    this.server.to('admin-room').emit(event, payload);
  }
}
