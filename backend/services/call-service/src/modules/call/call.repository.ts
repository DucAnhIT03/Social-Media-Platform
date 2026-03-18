import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../libs/database/prisma.service';

@Injectable()
export class CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserInConversation(conversationId: string, userId: string) {
    return this.prisma.conversationMember.findFirst({
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

  async listActiveMemberIds(conversationId: string): Promise<string[]> {
    const members = await this.prisma.conversationMember.findMany({
      where: {
        conversationId,
        leftAt: null,
      },
      select: {
        userId: true,
      },
    });

    return members.map((member) => member.userId);
  }
}
