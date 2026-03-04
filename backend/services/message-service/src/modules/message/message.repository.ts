import { Injectable } from '@nestjs/common';
import { MessageType, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../../libs/database/prisma.service';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): PrismaClient {
    return this.prisma;
  }

  createMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    type: MessageType;
  }) {
    const { conversationId, senderId, content, type } = params;
    return this.client.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
      },
    });
  }

  async listMessagesByConversation(
    conversationId: string,
    skip: number,
    take: number,
  ) {
    const [items, total] = await this.client.$transaction([
      this.client.message.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.client.message.count({
        where: { conversationId, isDeleted: false },
      }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.client.message.findUnique({
      where: { id },
    });
  }

  softDeleteMessage(id: string) {
    return this.client.message.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }
}

