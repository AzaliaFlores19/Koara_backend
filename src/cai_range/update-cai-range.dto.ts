import { IsOptional, IsString, IsInt, Min, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger'; 

export class UpdateCaiRangeDto {
  @ApiPropertyOptional({ description: 'Código base del rango', example: '000-001-01' })
  @IsOptional()
  @IsString()
  base_code?: string;

  @ApiPropertyOptional({ description: 'Nuevo rango inicial', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  range_start?: number;

  @ApiPropertyOptional({ description: 'Nuevo rango final', example: 6000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  range_end?: number;

  @ApiPropertyOptional({ description: 'Nueva fecha de expiración' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date;

  @ApiPropertyOptional({ description: 'Estado de activación del rango', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}