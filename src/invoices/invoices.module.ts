import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceItemsService } from './invoice-items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { InvoicesController } from './invoices.controller';
import { CaiModule } from '../cai/cai.module';

@Module({
  imports: [PrismaModule, AuditModule, CaiModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceItemsService],
  exports: [InvoicesService, InvoiceItemsService],
})
export class InvoicesModule {}
