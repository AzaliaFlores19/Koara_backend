import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private mapToResponseDto(invoice: any): InvoiceResponseDto {
    return plainToInstance(
      InvoiceResponseDto,
      {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId: invoice.client_id,
        cashierId: invoice.user_id,
        subtotal: invoice.subtotal?.toNumber
          ? invoice.subtotal.toNumber()
          : Number(invoice.subtotal || 0),
        taxes: invoice.taxes?.toNumber
          ? invoice.taxes.toNumber()
          : Number(invoice.taxes || 0),
        total: invoice.total?.toNumber
          ? invoice.total.toNumber()
          : Number(invoice.total || 0),
        status: 'active', // Note: You can derive status dynamically based on other DB conditions if needed
        issuedAt: invoice.created_at,
        items:
          invoice.invoice_items?.map((item: any) => ({
            id: item.id,
            invoiceId: item.invoice_id,
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price?.toNumber
              ? item.unit_price.toNumber()
              : Number(item.unit_price || 0),
            subtotal: item.item_subtotal?.toNumber
              ? item.item_subtotal.toNumber()
              : Number(item.item_subtotal || 0),
          })) || [],
      },
      { excludeExtraneousValues: false },
    );
  }

  @Post()
  async create(@Body() dto: CreateInvoiceDto, @Req() req) {
    const invoice = await this.invoicesService.createInvoice(
      dto,
      req.user.userId,
    );
    const fullInvoice = await this.invoicesService.findById(invoice.id);
    return this.mapToResponseDto(fullInvoice);
  }

  @Get()
  async findAll(@Query() filters: any) {
    const invoices = await this.invoicesService.findAll(filters);
    return invoices.map((inv) => this.mapToResponseDto(inv));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const invoice = await this.invoicesService.findById(id);
    return this.mapToResponseDto(invoice);
  }

  @Patch(':id/cancel')
  async cancelInvoice(@Param('id') id: string, @Req() req) {
    const invoice = await this.invoicesService.cancelInvoice(
      id,
      req.user.userId,
    );
    const dto = this.mapToResponseDto(invoice);
    dto.status = 'cancelled';
    return dto;
  }
}
