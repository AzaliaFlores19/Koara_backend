import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaiModule } from '../cai/cai.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CaiModule, AuditModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}