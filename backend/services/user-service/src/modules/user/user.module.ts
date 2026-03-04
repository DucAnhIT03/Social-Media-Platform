import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtStrategy } from '../../shared/auth/jwt.strategy';
import { EventBusService } from '../../shared/events/event-bus.service';
import { AuthServiceClient } from '../../shared/clients/auth-service.client';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [UserController],
  providers: [UserService, UserRepository, JwtStrategy, EventBusService, AuthServiceClient],
})
export class UserModule {}

