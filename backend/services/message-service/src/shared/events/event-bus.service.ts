import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  publish(eventName: string, payload: Record<string, any>) {
    this.logger.log(`[EVENT] ${eventName} ${JSON.stringify(payload)}`);
    return true;
  }
}

