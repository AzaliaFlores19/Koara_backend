import { IsOptional, IsInt, Min, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger'; 

export class UpdateCaiRangeDto {
  @ApiPropertyOptional({ description: 'Nuevo rango inicial', example: 10 })
  @IsOptional()
  @IsInt({ message: 'El rango inicial debe ser un número entero.' })
  @Min(1, { message: 'El rango inicial debe ser mayor a 0.' })
  range_start?: number;

  @ApiPropertyOptional({ description: 'Nuevo rango final', example: 6000 })
  @IsOptional()
  @IsInt({ message: 'El rango final debe ser un número entero.' })
  @Min(1, { message: 'El rango final debe ser mayor a 0.' })
  range_end?: number;

  @ApiPropertyOptional({ description: 'Nueva fecha de expiración', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Debe ser una fecha válida.' })
  expiration_date?: Date;

  @ApiPropertyOptional({ description: 'Estado de activación del rango', example: true })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true/false).' })
  is_active?: boolean;
}