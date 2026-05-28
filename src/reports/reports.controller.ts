import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExportService: ReportsExportService,
  ) {}

  @Get('sales')
  getSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.reportsService.getSalesList(startDate, endDate, clientId);
  }

  @Get('top-products')
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
  getMonthlySales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesOverview(startDate, endDate);
  }

  @Get('customer-history/:customerId')
  getCustomerHistory(@Param('customerId') customerId: string) {
    return this.reportsService.getCustomerPurchaseHistory(customerId);
  }

  @Get('customer-history/:customerId/export')
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
