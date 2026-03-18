import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtStrategy } from '../../shared/auth/jwt.strategy';
import { EventBusService } from '../../shared/events/event-bus.service';
import { CallController } from './call.controller';
import { CallService } from './call.service';
import { CallRepository } from './call.repository';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [CallController],
  providers: [CallService, CallRepository, JwtStrategy, EventBusService],
})
export class CallModule {}
