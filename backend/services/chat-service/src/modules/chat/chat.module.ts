import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtStrategy } from '../../shared/auth/jwt.strategy';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { EventBusService } from '../../shared/events/event-bus.service';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, JwtStrategy, EventBusService],
})
export class ChatModule {}
