import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis() {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = this.configService.get<number>('REDIS_PORT') ?? 6379;

    const pubClient = new Redis({ host, port });
    const subClient = new Redis({ host, port });

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (!this.adapterConstructor) {
      throw new Error(
        'RedisIoAdapter: connectToRedis must be called before creating server',
      );
    }

    server.adapter(this.adapterConstructor);
    return server;
  }
}

