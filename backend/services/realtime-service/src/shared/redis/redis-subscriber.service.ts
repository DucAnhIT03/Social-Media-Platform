import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RealtimeGateway } from '../../modules/realtime/realtime.gateway';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private subscriber: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = this.configService.get<number>('REDIS_PORT') ?? 6379;

    this.subscriber = new Redis({
      host,
      port,
    });

    const channels = [
      'message.created',
      'user.typing',
      'video-call.offer',
      'video-call.answer',
      'video-call.ice-candidate',
      'video-call.end',
      'audio-call.offer',
      'audio-call.answer',
      'audio-call.ice-candidate',
      'audio-call.end',
      'notification.created',
    ];

    const subscriber = this.subscriber;
    if (!subscriber) {
      return;
    }

    await subscriber.subscribe(...channels);

    subscriber.on('message', (channel, message) => {
      let payload: any;
      try {
        payload = JSON.parse(message);
      } catch {
        payload = { raw: message };
      }

      this.gateway.handleExternalEvent(channel, payload);
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }
}

