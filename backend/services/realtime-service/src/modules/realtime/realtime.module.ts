import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RedisSubscriberService } from '../../shared/redis/redis-subscriber.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, RedisSubscriberService],
})
export class RealtimeModule {}

