import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { entities, audit_action, Prisma } from '@prisma/client';

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

  async getAuditLogs(filters: {
    user?: string;
    entity?: entities;
    action?: audit_action;
    date?: string; // Formato esperado: YYYY-MM-DD
  }) {
    const where: Prisma.Audit_LogsWhereInput = {};

    if (filters.user) {
      where.user_id = filters.user;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(filters.date);
      endDate.setUTCHours(23, 59, 59, 999);

      where.created_at = {
        gte: startDate,
        lte: endDate,
      };
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
