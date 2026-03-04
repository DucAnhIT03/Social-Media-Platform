import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../../libs/database/database.module';

/**
 * PrismaModule: bọc DatabaseModule để user-service import theo đúng naming yêu cầu.
 * Thực tế PrismaService nằm ở libs/database (dùng chung cho toàn hệ thống).
 */
@Module({
  imports: [DatabaseModule],
  exports: [DatabaseModule],
})
export class PrismaModule {}

