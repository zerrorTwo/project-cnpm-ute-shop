import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from '../../services/chat.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('conversations')
  async getAllConversations() {
    const conversations = await this.chatService.getAllConversations();
    return {
      success: true,
      data: conversations,
    };
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string) {
    const conversation = await this.chatService.getConversationDetail(id);
    return {
      success: true,
      data: conversation,
    };
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { senderId: number; content: string; isAdminReply: boolean },
  ) {
    const message = await this.chatService.saveMessage({
      conversationId,
      senderId: body.senderId,
      content: body.content,
      isAdminReply: body.isAdminReply,
    });

    return {
      success: true,
      data: message,
    };
  }

  @Post('conversations/:id/read')
  async markAsRead(@Param('id') conversationId: string) {
    await this.chatService.markAsRead(conversationId);
    return {
      success: true,
      message: 'Conversation marked as read',
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryService.uploadImage(file);

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    };
  }
}
