import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Ép kiểu any để tránh lỗi type của PrismaClient.$on với TS strict
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}

