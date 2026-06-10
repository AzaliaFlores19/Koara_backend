import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { entities, audit_action, Prisma } from '@prisma/client';

import { AuditFiltersDto } from './dto/audit-filters.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog(
    userId: string,
    entity: entities,
    entityId: string,
    action: audit_action,
  ) {
    return this.prisma.audit_Logs.create({
      data: {
        user_id: userId,
        entity,
        entity_id: entityId,
        action,
      },
    });
  }

  async getAuditLogs(filters: AuditFiltersDto) {
    const where: Prisma.Audit_LogsWhereInput = {};

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.created_at.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    return this.prisma.audit_Logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
