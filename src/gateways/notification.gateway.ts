import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    try {
      const query = client.handshake.query as any;
      const userId = query?.userId;
      if (userId) {
        const room = `user-${userId}`;
        client.join(room);
        this.logger.log(`Socket ${client.id} joined ${room}`);
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

  sendToUser(userId: number, payload: any) {
    try {
      const room = `user-${userId}`;
      this.server.to(room).emit('notification', payload);
    } catch (err) {
      this.logger.warn('Failed to emit to user: ' + err?.message);
    }
  }
}
