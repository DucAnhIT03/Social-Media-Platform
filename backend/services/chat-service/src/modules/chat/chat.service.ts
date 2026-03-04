import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { CreateConversationDto, ConversationKind } from './dto/create-conversation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ChatService {
  constructor(private readonly repo: ChatRepository) {}

  async createConversation(currentUserId: string, dto: CreateConversationDto) {
    if (dto.type === ConversationKind.PRIVATE) {
      if (!dto.participantId) {
        throw new ForbiddenException('participantId is required for private conversation');
      }
      if (dto.participantId === currentUserId) {
        throw new ForbiddenException('Cannot create private conversation with yourself');
      }
      return this.repo.createPrivateConversation(currentUserId, dto.participantId);
    }

    if (!dto.title) {
      throw new ForbiddenException('title is required for group conversation');
    }
    const memberIds = dto.memberIds ?? [];
    return this.repo.createGroupConversation(currentUserId, dto.title, memberIds);
  }

  async listConversations(currentUserId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.repo.listUserConversations(currentUserId, skip, limit);
  }

  async sendMessage(currentUserId: string, dto: SendMessageDto) {
    const membership = await this.repo.ensureUserInConversation(
      dto.conversationId,
      currentUserId,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return this.repo.sendMessage(dto.conversationId, currentUserId, dto.content);
  }

  async getMessages(
    currentUserId: string,
    conversationId: string,
    query: PaginationQueryDto,
  ) {
    const membership = await this.repo.ensureUserInConversation(
      conversationId,
      currentUserId,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.repo.listMessages(conversationId, skip, limit);
  }

  async deleteMessage(currentUserId: string, messageId: string) {
    const result = await this.repo.softDeleteMessage(messageId, currentUserId);
    if (!result) {
      throw new NotFoundException('Message not found or not owned by user');
    }
    return { success: true };
  }

  async addMember(
    currentUserId: string,
    conversationId: string,
    dto: AddMemberDto,
  ) {
    const membership = await this.repo.ensureUserInConversation(
      conversationId,
      currentUserId,
    );

    if (!membership || !membership.conversation.isGroup) {
      throw new ForbiddenException('Only group members can add users to group');
    }

    if (
      membership.role !== 'OWNER' &&
      membership.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Only owner or admin can add members');
    }

    await this.repo.addMemberToGroup(conversationId, dto.userId);
    return { success: true };
  }

  async leaveGroup(currentUserId: string, conversationId: string) {
    const membership = await this.repo.ensureUserInConversation(
      conversationId,
      currentUserId,
    );

    if (!membership || !membership.conversation.isGroup) {
      throw new ForbiddenException('Not a member of this group');
    }

    await this.repo.leaveConversation(conversationId, currentUserId);
    return { success: true };
  }
}

