import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { entities, audit_action } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener registros de auditoría' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAuditLogs(
    @Query('user') user?: string,
    @Query('entity') entity?: entities,
    @Query('action') action?: audit_action,
    @Query('date') date?: string,
  ) {
    return this.auditService.getAuditLogs({ user, entity, action, date });
  }
}
