import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../../libs/database/database.module';

@Module({
  imports: [DatabaseModule],
  exports: [DatabaseModule],
})
export class PrismaModule {}
