import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Event bus đơn giản: log + publish sang Redis để realtime-service có thể xử lý.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly redis: Redis | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = this.configService.get<number>('REDIS_PORT') ?? 6379;

    this.redis = new Redis({
      host,
      port,
    });
  }

  async publish(eventName: string, payload: Record<string, any>) {
    this.logger.log(`[EVENT] ${eventName} ${JSON.stringify(payload)}`);

    if (this.redis) {
      try {
        await this.redis.publish(eventName, JSON.stringify(payload));
      } catch (err) {
        this.logger.error(
          `Failed to publish event ${eventName} to Redis`,
          err as any,
        );
      }
    }

    return true;
  }
}

