import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() dto: CreateInvoiceDto, @Req() req) {
    const invoice = await this.invoicesService.createInvoice(dto, req.user.id);
    const fullInvoice = await this.invoicesService.findById(invoice.id);
    return fullInvoice;
  }

  @Post('preview')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="preview.pdf"')
  async preview(
    @Body() dto: CreateInvoiceDto,
    @Req() req,
  ): Promise<StreamableFile> {
    const buffer = (await this.invoicesService.createInvoice(
      dto,
      req.user.id,
      true,
    )) as Buffer;
    return new StreamableFile(buffer);
  }

  @Get()
  async findAll(@Query() filters: any) {
    const invoices = await this.invoicesService.findAll(filters);
    return invoices;
  }

  @Get('active')
  async findActive(@Query() filters: any) {
    const invoices = await this.invoicesService.findActive(filters);
    return invoices;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const invoice = await this.invoicesService.findById(id);
    return invoice;
  }
}
