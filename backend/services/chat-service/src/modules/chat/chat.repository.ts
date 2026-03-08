import { Injectable } from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PrismaService } from '../../../../../libs/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): PrismaClient {
    return this.prisma;
  }

  async createPrivateConversation(
    currentUserId: string,
    participantId: string,
  ) {
    return this.client.$transaction(async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          type: ConversationType.PRIVATE,
          isGroup: false,
          members: {
            some: { userId: currentUserId },
          },
          AND: [
            {
              members: {
                some: { userId: participantId },
              },
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (existing) {
        await tx.conversationMember.updateMany({
          where: {
            conversationId: existing.id,
            userId: {
              in: [currentUserId, participantId],
            },
          },
          data: {
            leftAt: null,
          },
        });

        return existing;
      }

      const conversation = await tx.conversation.create({
        data: {
          type: ConversationType.PRIVATE,
          isGroup: false,
          createdById: currentUserId,
          members: {
            create: [
              {
                userId: currentUserId,
                role: ConversationMemberRole.OWNER,
              },
              {
                userId: participantId,
                role: ConversationMemberRole.MEMBER,
              },
            ],
          },
        },
      });

      return conversation;
    });
  }

  async createGroupConversation(
    currentUserId: string,
    title: string,
    memberIds: string[],
  ) {
    const uniqueMemberIds = Array.from(
      new Set(memberIds.filter((id) => id !== currentUserId)),
    );

    return this.client.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: ConversationType.GROUP,
          isGroup: true,
          title,
          createdById: currentUserId,
          members: {
            create: [
              {
                userId: currentUserId,
                role: ConversationMemberRole.OWNER,
              },
              ...uniqueMemberIds.map((userId) => ({
                userId,
                role: ConversationMemberRole.MEMBER,
              })),
            ],
          },
        },
      });

      return conversation;
    });
  }

  async listUserConversations(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: any[]; total: number }> {
    const [items] = await this.client.$transaction([
      this.client.conversationMember.findMany({
        where: {
          userId,
          leftAt: null,
        },
        include: {
          conversation: {
            include: {
              members: {
                select: {
                  userId: true,
                  role: true,
                },
              },
              messages: {
                where: { isDeleted: false },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          conversation: {
            updatedAt: 'desc',
          },
        },
        skip,
        take,
      }),
      this.client.conversationMember.count({
        where: {
          userId,
          leftAt: null,
        },
      }),
    ]);

    const mapped = items.map((m) => ({
      id: m.conversation.id,
      type: m.conversation.type,
      title: m.conversation.title,
      isGroup: m.conversation.isGroup,
      createdAt: m.conversation.createdAt,
      updatedAt: m.conversation.updatedAt,
      memberIds: m.conversation.members.map((member) => member.userId),
      lastMessage: m.conversation.messages[0] ?? null,
    }));

    const deduped = new Map<string, (typeof mapped)[number]>();

    for (const conversation of mapped) {
      const key =
        conversation.type === ConversationType.PRIVATE
          ? `private:${[...conversation.memberIds].sort().join(':')}`
          : `conversation:${conversation.id}`;

      const existed = deduped.get(key);
      if (!existed) {
        deduped.set(key, conversation);
        continue;
      }

      if (new Date(conversation.updatedAt) > new Date(existed.updatedAt)) {
        deduped.set(key, conversation);
      }
    }

    const dedupedItems = Array.from(deduped.values())
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(({ memberIds, ...rest }) => rest);

    return { items: dedupedItems, total: dedupedItems.length };
  }

  async ensureUserInConversation(conversationId: string, userId: string) {
    return this.client.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      include: {
        conversation: true,
      },
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ) {
    return this.client.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });
  }

  async listActiveMemberIds(conversationId: string): Promise<string[]> {
    const members = await this.client.conversationMember.findMany({
      where: {
        conversationId,
        leftAt: null,
      },
      select: {
        userId: true,
      },
    });

    return members.map((m) => m.userId);
  }

  async listMessages(
    conversationId: string,
    skip: number,
    take: number,
  ): Promise<{ items: any[]; total: number }> {
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

  async softDeleteMessage(messageId: string, userId: string) {
    const message = await this.client.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      return null;
    }

    return this.client.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
      },
    });
  }

  async addMemberToGroup(
    conversationId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.client.conversationMember.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        } as Prisma.ConversationMemberConversationIdUserIdCompoundUniqueInput,
      },
      update: {
        leftAt: null,
      },
      create: {
        conversationId,
        userId: targetUserId,
        role: ConversationMemberRole.MEMBER,
      },
    });
  }

  async leaveConversation(conversationId: string, userId: string) {
    return this.client.conversationMember.updateMany({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  async removeConversationForUser(conversationId: string, userId: string) {
    return this.client.conversationMember.updateMany({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }
}

