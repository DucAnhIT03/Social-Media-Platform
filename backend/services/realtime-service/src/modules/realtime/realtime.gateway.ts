import {
  Logger,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface JwtPayload {
  sub: string;
  email: string;
}

interface WsUser {
  userId: string;
  email: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // userId -> set of socketIds
  private readonly userSockets = new Map<string, Set<string>>();
  // socketId -> userId
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // =============== Connection Handling & JWT Auth ===============

  async handleConnection(client: Socket) {
    try {
      const user = this.authenticateClient(client);
      if (!user) {
        this.logger.warn('Unauthorized socket connection, disconnecting');
        client.disconnect(true);
        return;
      }

      (client.data as any).user = user;
      this.registerOnline(client.id, user.userId);

      // Join personal room for direct targeting (notifications, calls...)
      client.join(this.getUserRoom(user.userId));

      this.logger.log(
        `Client connected: socketId=${client.id}, userId=${user.userId}`,
      );
    } catch (err: any) {
      // Nếu token hết hạn hoặc không hợp lệ, chỉ log warning ngắn gọn tránh spam stack trace
      if (err?.name === 'TokenExpiredError') {
        this.logger.warn('Socket auth failed: access token expired');
      } else {
        this.logger.error('Error during socket connection auth', err as any);
      }
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.unregisterOnline(client.id, userId);
      this.logger.log(
        `Client disconnected: socketId=${client.id}, userId=${userId}`,
      );
    } else {
      this.logger.log(`Client disconnected: socketId=${client.id}`);
    }
  }

  private authenticateClient(client: Socket): WsUser | null {
    const authHeader = client.handshake.headers['authorization'];
    const tokenFromHeader =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    const tokenFromAuth = (client.handshake.auth as any)?.token as
      | string
      | undefined;

    const token = tokenFromHeader || tokenFromAuth;

    if (!token) {
      return null;
    }

    const secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? '';

    const payload = this.jwtService.verify<JwtPayload>(token, {
      secret,
    });

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }

  private registerOnline(socketId: string, userId: string) {
    this.socketUsers.set(socketId, userId);
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private unregisterOnline(socketId: string, userId: string) {
    this.socketUsers.delete(socketId);
    const set = this.userSockets.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  // =============== Client Events ===============

  // Client yêu cầu join vào room conversation
  @SubscribeMessage('conversation.join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const room = this.getConversationRoom(data.conversationId);
    client.join(room);
    this.logger.log(
      `Socket ${client.id} joined conversation room ${data.conversationId}`,
    );
  }

  // user.typing từ client -> broadcast cho cùng conversation
  @SubscribeMessage('user.typing')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; isTyping: boolean },
  ) {
    if (!data?.conversationId) return;
    const user = (client.data as any).user as WsUser | undefined;
    if (!user) return;

    const room = this.getConversationRoom(data.conversationId);
    this.server.to(room).emit('user.typing', {
      conversationId: data.conversationId,
      userId: user.userId,
      isTyping: data.isTyping,
    });
  }

  // =============== Events from Redis (other services) ===============

  handleExternalEvent(channel: string, payload: any) {
    switch (channel) {
      case 'message.created': {
        const conversationId = payload?.conversationId;
        if (!conversationId) return;

        const room = this.getConversationRoom(conversationId);
        this.server.to(room).emit('message.created', payload);

        const recipientIds = Array.isArray(payload?.recipientIds)
          ? (payload.recipientIds as string[])
          : [];

        recipientIds.forEach((userId) => {
          const userRoom = this.getUserRoom(userId);
          this.server.to(userRoom).emit('message.created', payload);
        });

        break;
      }
      case 'notification.created': {
        const userId = payload?.userId;
        if (!userId) return;
        const room = this.getUserRoom(userId);
        this.server.to(room).emit('notification.created', payload);
        break;
      }
      case 'call.offer': {
        const targetUserId = payload?.targetUserId;
        if (!targetUserId) return;
        const room = this.getUserRoom(targetUserId);
        this.server.to(room).emit('call.offer', payload);
        break;
      }
      case 'call.answer': {
        const targetUserId = payload?.targetUserId;
        if (!targetUserId) return;
        const room = this.getUserRoom(targetUserId);
        this.server.to(room).emit('call.answer', payload);
        break;
      }
      case 'user.typing': {
        const conversationId = payload?.conversationId;
        if (!conversationId) return;
        const room = this.getConversationRoom(conversationId);
        this.server.to(room).emit('user.typing', payload);
        break;
      }
      default: {
        this.logger.warn(`Received event on unknown channel: ${channel}`);
      }
    }
  }
}

