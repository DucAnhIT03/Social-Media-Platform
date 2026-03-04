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
import { JwtAuthGuard } from '../../shared/auth/jwt.guard';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // POST /messages -> Gửi message
  @Post()
  sendMessage(@Req() req: RequestWithUser, @Body() dto: SendMessageDto) {
    return this.messageService.sendMessage(req.user.userId, dto);
  }

  // GET /messages/:conversationId?page=1&limit=20
  @Get(':conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messageService.getMessagesByConversation(
      conversationId,
      query,
    );
  }

  // DELETE /messages/:id -> Soft delete
  @Delete(':id')
  deleteMessage(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.messageService.deleteMessage(req.user.userId, id);
  }
}

