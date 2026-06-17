import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExportService: ReportsExportService,
  ) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Obtener analytics de ventas y clientes' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Datos de analytics', type: AnalyticsResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getAnalytics(startDate, endDate);
  }

  @Get('analytics/export')
  @ApiOperation({ summary: 'Exportar analytics de ventas y clientes' })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'csv'], description: 'Formato de exportación' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Archivo exportado (PDF o CSV)' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async exportAnalytics(
    @Query('format') format: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    const file = await this.reportsExportService.exportReport(
      'analytics',
      format,
      { startDate, endDate },
    );

    this.sendFile(response, file);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Obtener reporte de ventas por rango de fechas' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente para filtrar' })
  @ApiResponse({ status: 200, description: 'Lista de ventas en el rango de fechas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.reportsService.getSalesList(startDate, endDate, clientId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Obtener los productos más vendidos' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de productos a retornar (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de productos más vendidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getTopProducts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopSellingProducts(limit ? +limit : 10, {
      startDate,
      endDate,
    });
  }

  @Get('frequent-customers')
  @ApiOperation({ summary: 'Obtener los clientes más frecuentes' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de clientes a retornar (default: 10)' })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Lista de clientes más frecuentes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getFrequentCustomers(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFrequentCustomers(limit ? +limit : 10, {
      startDate,
      endDate,
    });
  }

  @Get('monthly-sales')
  @ApiOperation({ summary: 'Obtener resumen de ventas mensuales' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Resumen de ventas por mes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getMonthlySales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesOverview(startDate, endDate);
  }

  @Get('customer-history/:customerId')
  @ApiOperation({ summary: 'Obtener historial de compras de un cliente' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Historial de compras del cliente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getCustomerHistory(@Param('customerId') customerId: string) {
    return this.reportsService.getCustomerPurchaseHistory(customerId);
  }

  @Get('customer-history/:customerId/export')
  @ApiOperation({ summary: 'Exportar historial de compras de un cliente' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'csv'], description: 'Formato de exportación' })
  @ApiResponse({ status: 200, description: 'Archivo exportado (PDF o CSV)' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async exportCustomerHistory(
    @Param('customerId') customerId: string,
    @Query('format') format: string,
    @Res() response: Response,
  ) {
    const file = await this.reportsExportService.exportReport(
      'customer-history',
      format,
      { customerId },
    );

    this.sendFile(response, file);
  }

  @Get(':reportType/export')
  @ApiOperation({ summary: 'Exportar cualquier reporte' })
  @ApiParam({ name: 'reportType', description: 'Tipo de reporte', enum: ['sales', 'top-products', 'frequent-customers', 'monthly-sales', 'customer-history', 'analytics'] })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'csv'], description: 'Formato de exportación' })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({ status: 200, description: 'Archivo exportado (PDF o CSV)' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async exportReport(
    @Param('reportType') reportType: string,
    @Query('format') format: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit: string,
    @Query('clientId') clientId: string,
    @Res() response: Response,
  ) {
    const file = await this.reportsExportService.exportReport(
      reportType,
      format,
      { startDate, endDate, limit, clientId },
    );

    this.sendFile(response, file);
  }

  private sendFile(
    response: Response,
    file: { filename: string; contentType: string; buffer: Buffer },
  ) {
    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.send(file.buffer);
  }
}
