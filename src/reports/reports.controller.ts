import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesList(startDate, endDate);
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
  getFrequentCustomers(@Query('limit') limit?: string) {
    return this.reportsService.getFrequentCustomers(limit ? +limit : 10);
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
}
