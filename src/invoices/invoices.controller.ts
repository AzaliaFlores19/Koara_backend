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
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva factura' })
  @ApiResponse({ status: 201, description: 'Factura creada con éxito.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateInvoiceDto, @Req() req) {
    const invoice = await this.invoicesService.createInvoice(dto, req.user.id);
    if (Buffer.isBuffer(invoice)) {
      throw new Error('Expected invoice object, but got Buffer');
    }
    const fullInvoice = await this.invoicesService.findById(invoice.id);
    return fullInvoice;
  }

  @Post('/preview')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="preview.pdf"')
  @ApiOperation({ summary: 'Vista previa de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Vista previa de la factura generada con éxito.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura obtenida con éxito.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findById(@Param('id') id: string) {
    const invoice = await this.invoicesService.findById(id);
    return invoice;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las facturas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas obtenida con éxito.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query() filters: InvoiceFiltersDto) {
    const invoices = await this.invoicesService.findAll(filters);
    return invoices;
  }

  @Get('/active')
  @ApiOperation({ summary: 'Obtener facturas activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas activas obtenida con éxito.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findActive(@Query() filters: InvoiceFiltersDto) {
    const invoices = await this.invoicesService.findActive(filters);
    return invoices;
  }

  @Get('/total-invoices')
  @ApiOperation({ summary: 'Obtener total de ventas por rango de fechas' })
  @ApiResponse({
    status: 200,
    description: 'Total de ventas obtenido con éxito.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTotalSalesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.invoicesService.getTotalSalesByDateRange(startDate, endDate);
  }
}
