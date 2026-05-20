import { Module } from '@nestjs/common';
import { CaiRangeService } from './cai_range.service';
import { CaiRangeController } from './cai_range.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CaiRangeController],
  providers: [CaiRangeService],
  exports: [CaiRangeService],
})
export class CaiRangeModule {}