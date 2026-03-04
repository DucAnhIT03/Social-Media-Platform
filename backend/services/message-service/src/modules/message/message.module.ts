import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtStrategy } from '../../shared/auth/jwt.strategy';
import { EventBusService } from '../../shared/events/event-bus.service';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageRepository } from './message.repository';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository, JwtStrategy, EventBusService],
})
export class MessageModule {}

