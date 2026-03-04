import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { MessageRepository } from './message.repository';
import { SendMessageDto, MessageTypeDto } from './dto/send-message.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { EventBusService } from '../../shared/events/event-bus.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly repo: MessageRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async sendMessage(currentUserId: string, dto: SendMessageDto) {
    const trimmed = dto.content.trim();
    if (!trimmed) {
      throw new ForbiddenException('Content must not be empty');
    }

    const typeMap: Record<MessageTypeDto, MessageType> = {
      [MessageTypeDto.TEXT]: MessageType.TEXT,
      [MessageTypeDto.IMAGE]: MessageType.IMAGE,
      [MessageTypeDto.VIDEO]: MessageType.VIDEO,
      [MessageTypeDto.FILE]: MessageType.FILE,
    };

    const prismaType = typeMap[dto.type];
    if (!prismaType) {
      throw new ForbiddenException('Invalid message type');
    }

    const message = await this.repo.createMessage({
      conversationId: dto.conversationId,
      senderId: currentUserId,
      content: trimmed,
      type: prismaType,
    });

    // Publish domain event
    this.eventBus.publish('message.created', {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      createdAt: message.createdAt,
    });

    return message;
  }

  async getMessagesByConversation(
    conversationId: string,
    query: PaginationQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.repo.listMessagesByConversation(conversationId, skip, limit);
  }

  async deleteMessage(currentUserId: string, messageId: string) {
    const message = await this.repo.findById(messageId);
    if (!message || message.isDeleted) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.repo.softDeleteMessage(messageId);
    return { success: true };
  }
}

