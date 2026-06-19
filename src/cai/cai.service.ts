import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaiWithRangeDto } from './create-cai-dto' 
import { UpdateCaiWithRangeDto } from './update-cai-dto';
import { AuditService } from '../audit/audit.service';
import { audit_action, entities } from '@prisma/client';

@Injectable()
export class CaiService {
  private readonly HARDCODED_BASE_CODE = '001-001-01';
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createWithRange(dto: CreateCaiWithRangeDto, userId: string) {
    const existingCai = await this.prisma.cAI.findUnique({
      where: { cai_code: dto.cai_code },
    });
    if (existingCai) throw new ConflictException('El código CAI ya existe.');
    if (dto.range_start >= dto.range_end) throw new BadRequestException('El rango inicial debe ser menor.');
    if (new Date(dto.expiration_date) <= new Date()) throw new BadRequestException('La fecha debe ser futura.');

    return await this.prisma.$transaction(async (tx) => {
      await tx.cAI_Range.updateMany({ where: { is_active: true }, data: { is_active: false } });
      await tx.cAI.updateMany({ where: { is_active: true }, data: { is_active: false } });

      const cai = await tx.cAI.create({
        data: { cai_code: dto.cai_code, is_active: true },
      });

      const range = await tx.cAI_Range.create({
        data: {
          cai_id: cai.id,
          range_start: dto.range_start,
          range_end: dto.range_end,
          expiration_date: new Date(dto.expiration_date),
          base_code: this.HARDCODED_BASE_CODE,
          current_invoice_number: dto.range_start,
          is_active: true,
        },
      });

      await this.auditService.createLog(userId, entities.CAI, cai.id, audit_action.CREATE);
      await this.auditService.createLog(userId, entities.CAI_RANGE, range.id, audit_action.CREATE);

      return { cai, range };
    });
  }

  async findById(id: string) {
    const cai = await this.prisma.cAI.findUnique({ where: { id } });
    if (!cai) throw new NotFoundException('CAI no encontrado');
    return cai;
  }

  async findAll() {
    return this.prisma.cAI.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async updateWithRange(caiId: string, rangeId: string, dto: UpdateCaiWithRangeDto, userId: string) {
    const currentCai = await this.findById(caiId);

    const currentRange = await this.prisma.cAI_Range.findUnique({
      where: { id: rangeId },
    });
    if (!currentRange || currentRange.cai_id !== caiId) {
      throw new NotFoundException('El rango de facturación solicitado no existe o no pertenece a este CAI.');
    }

    if (!currentCai.is_active || !currentRange.is_active) {
      throw new BadRequestException('No se puede modificar este bloque porque ya se encuentra INACTIVO o en el historial.');
    }

    if (new Date(currentRange.expiration_date) <= new Date()) {
      throw new BadRequestException('No se puede modificar este bloque de facturación porque su fecha de límite de emisión ya VENCIÓ.');
    }

    if (currentRange.current_invoice_number >= currentRange.range_end) {
      throw new BadRequestException(
    'No se puede modificar este bloque debido a que ya se alcanzó el límite máximo de facturas autorizadas para este rango.',
      );
    }

    if (dto.expiration_date && new Date(dto.expiration_date) <= new Date()) {
      throw new BadRequestException('La nueva fecha de expiración debe ser una fecha futura.');
    }

    if (dto.range_start || dto.range_end) {
      const invoiceCount = await this.prisma.invoices.count({
        where: { cai_range_id: rangeId },
      });

      if (invoiceCount > 0) {
        throw new BadRequestException(
          'No se pueden alterar las propiedades estructurales de este bloque porque ya cuenta con facturas comerciales emitidas.',
        );
      }
    }

    if (dto.cai_code) {
      const duplicateCai = await this.prisma.cAI.findFirst({
        where: {
          cai_code: dto.cai_code,
          id: { not: caiId },
        },
      });
      if (duplicateCai) {
        throw new ConflictException('El código CAI ingresado ya pertenece a otro registro del historial.');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const caiResult = dto.cai_code
        ? await tx.cAI.update({
            where: { id: caiId },
            data: { cai_code: dto.cai_code },
          })
        : await tx.cAI.findUnique({ where: { id: caiId } });

      if (dto.cai_code) {
        await this.auditService.createLog(userId, entities.CAI, caiId, audit_action.UPDATE);
      }

      const rangeResult = (dto.range_start || dto.range_end || dto.expiration_date)
        ? await tx.cAI_Range.update({
            where: { id: rangeId },
            data: {
              ...(dto.range_start && { range_start: dto.range_start, current_invoice_number: dto.range_start }),
              ...(dto.range_end && { range_end: dto.range_end }),
              ...(dto.expiration_date && { expiration_date: new Date(dto.expiration_date) }),
            },
          })
        : await tx.cAI_Range.findUnique({ where: { id: rangeId } });

      if (dto.range_start || dto.range_end || dto.expiration_date) {
        await this.auditService.createLog(userId, entities.CAI_RANGE, rangeId, audit_action.UPDATE);
      }

      return { cai: caiResult, range: rangeResult };
    });
  }
}

 