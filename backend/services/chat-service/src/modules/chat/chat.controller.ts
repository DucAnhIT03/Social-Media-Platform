import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../shared/auth/jwt.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AddMemberDto } from './dto/add-member.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 1. Create conversation (private or group)
  @Post('conversations')
  createConversation(
    @Req() req: RequestWithUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(req.user.userId, dto);
  }

  // 2. List conversations of current user
  @Get('conversations')
  listConversations(
    @Req() req: RequestWithUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.listConversations(req.user.userId, query);
  }

  // 3. Send message
  @Post('messages')
  sendMessage(@Req() req: RequestWithUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.userId, dto);
  }

  // 4. Get messages by conversation (pagination)
  @Get('conversations/:id/messages')
  getMessages(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.getMessages(
      req.user.userId,
      conversationId,
      query,
    );
  }

  // 5. Soft delete message
  @Delete('messages/:id')
  deleteMessage(@Req() req: RequestWithUser, @Param('id') messageId: string) {
    return this.chatService.deleteMessage(req.user.userId, messageId);
  }

  // 6. Add member to group
  @Post('conversations/:id/members')
  addMember(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.chatService.addMember(req.user.userId, conversationId, dto);
  }

  // 7. Leave group
  @Post('conversations/:id/leave')
  leaveGroup(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.leaveGroup(req.user.userId, conversationId);
  }
}

