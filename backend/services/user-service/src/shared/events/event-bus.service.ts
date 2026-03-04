import { Injectable, Logger } from '@nestjs/common';

/**
 * Giả lập publish event (sau này có thể thay bằng Kafka/NATS/RabbitMQ).
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  publish(eventName: string, payload: Record<string, any>) {
    this.logger.log(`[EVENT] ${eventName} ${JSON.stringify(payload)}`);
    return true;
  }
}

