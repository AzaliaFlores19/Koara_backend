import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceItemsService } from './invoice-items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceItemsService],
  exports: [InvoicesService, InvoiceItemsService],
})
export class InvoicesModule {}
