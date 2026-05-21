import { Module } from '@nestjs/common';
import { CaiService } from './cai.service';
import { CaiController } from './cai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CaiController],
  providers: [CaiService],
  exports: [CaiService],
})
export class CaiModule {}