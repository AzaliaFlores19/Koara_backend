import { Module } from '@nestjs/common';
import { CaiRangeService } from './cai_range.service';
import { CaiRangeController } from './cai_range.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CaiRangeController],
  providers: [CaiRangeService],
  exports: [CaiRangeService],
})
export class CaiRangeModule {}