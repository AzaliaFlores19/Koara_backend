import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsResponseDto {
  @ApiProperty({ example: 247 })
  total_invoices: number;

  @ApiProperty({ example: 1245.00 })
  total_before_tax: number;

  @ApiProperty({ example: 14031.00 })
  total_after_tax: number;

  @ApiProperty({ example: 89 })
  unique_clients: number;

  @ApiProperty({ example: 50.70 })
  average_per_invoice: number;

  @ApiProperty({ example: 160.69 })
  average_per_client: number;

  @ApiProperty({ example: 1850.00 })
  taxes_collected: number;

  @ApiProperty({ example: 2.8 })
  invoices_per_client: number;
}
