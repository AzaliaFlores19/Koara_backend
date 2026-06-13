import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { entities, audit_action } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AuditFiltersDto {
  @ApiProperty({ required: false, description: 'ID del usuario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ required: false, enum: entities, description: 'Entidad afectada' })
  @IsOptional()
  @IsEnum(entities)
  entity?: entities;

  @ApiProperty({ required: false, enum: audit_action, description: 'Acción realizada' })
  @IsOptional()
  @IsEnum(audit_action)
  action?: audit_action;

  @ApiProperty({ required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
