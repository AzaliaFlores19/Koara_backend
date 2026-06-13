import { IsOptional, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InvoiceFiltersDto {
  @ApiProperty({ required: false, description: 'ID del cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Total mínimo' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minTotal?: number;

  @ApiProperty({ required: false, description: 'Total máximo' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxTotal?: number;
}
