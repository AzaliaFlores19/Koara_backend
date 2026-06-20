import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaiRangeDto } from './create-cai-range.dto';
import { UpdateCaiRangeDto } from './update-cai-range.dto';
import { AuditService } from '../audit/audit.service';
import { audit_action, entities } from '@prisma/client';

@Injectable()
export class CaiRangeService {
  private readonly HARDCODED_BASE_CODE = '001-001-01';

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createCaiRange(dto: CreateCaiRangeDto, userId: string) {
    const existingCai = await this.prisma.cAI.findUnique({
      where: { id: dto.cai_id },
    });
    if (!existingCai) {
      throw new NotFoundException('El CAI asociado no existe.');
    }

    if (dto.range_start >= dto.range_end) {
      throw new BadRequestException(
        'El rango inicial debe ser menor que el rango final',
      );
    }

    if (new Date(dto.expiration_date) <= new Date()) {
      throw new BadRequestException(
        'La fecha de expiración debe ser una fecha futura.',
      );
    }

    await this.validateOverlapping(
      this.HARDCODED_BASE_CODE,
      dto.range_start,
      dto.range_end,
      dto.cai_id,
    );

    const totalRangesCount = await this.prisma.cAI_Range.count();
    const initialActiveStatus = totalRangesCount === 0;

    const caiRange = await this.prisma.cAI_Range.create({
      data: {
        cai_id: dto.cai_id,
        range_start: dto.range_start,
        range_end: dto.range_end,
        expiration_date: dto.expiration_date,
        base_code: this.HARDCODED_BASE_CODE,
        current_invoice_number: dto.range_start,
        is_active: initialActiveStatus, 
      },
    });

    await this.auditService.createLog(
      userId,
      entities.CAI_RANGE,
      caiRange.id,
      audit_action.CREATE,
      `Rango ${caiRange.range_start}-${caiRange.range_end}`,
    );

    return caiRange;
  }

  async findAll() {
    return this.prisma.cAI_Range.findMany({
      include: { cai: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    const range = await this.prisma.cAI_Range.findUnique({
      where: { id },
      include: { cai: true },
    });
    if (!range) throw new NotFoundException('Rango de CAI no encontrado.');
    return range;
  }

  async findActive() {
    return this.prisma.cAI_Range.findFirst({
      where: { is_active: true },
      include: { cai: true },
    });
  }

  async updateCaiRange(id: string, dto: UpdateCaiRangeDto, userId: string) {
    const currentRange = await this.findById(id);

    if (dto.range_start || dto.range_end) {
      const invoiceCount = await this.prisma.invoices.count({
        where: { cai_range_id: id },
      });

      if (invoiceCount > 0) {
        throw new BadRequestException(
          'No se pueden modificar los límites numéricos de este rango porque ya tiene facturas asociadas.',
        );
      }
    }

    const updateRange = { ...currentRange, ...dto };
    const start = updateRange.range_start;
    const end = updateRange.range_end;
    const baseCode = this.HARDCODED_BASE_CODE;

    if (start >= end) {
      throw new BadRequestException(
        'El rango inicial debe ser menor que el rango final.',
      );
    }

    if (dto.range_start || dto.range_end) {
      await this.validateOverlapping(baseCode, start, end, id);
    }

    if (dto.is_active === true && !currentRange.is_active) {
      if (new Date() > new Date(currentRange.expiration_date)) {
        throw new BadRequestException('No se puede activar este rango porque ya expiró su fecha de validez.');
      }
      if (currentRange.current_invoice_number > currentRange.range_end) {
        throw new BadRequestException('No se puede activar este rango porque ya agotó su límite de facturas autorizado.');
      }

      return await this.prisma.$transaction(async (tx) => {
        const activeRange = await tx.cAI_Range.findFirst({ where: { is_active: true } });
        if (activeRange && activeRange.cai_id) {
          const activeRangeCaiId = activeRange.cai_id as string;
          await tx.cAI_Range.update({ where: { id: activeRange.id }, data: { is_active: false } });
          await tx.cAI.update({ where: { id: activeRangeCaiId }, data: { is_active: false } });
        }
        await tx.cAI.update({ where: { id: currentRange.cai_id as string }, data: { is_active: true } });
        return await tx.cAI_Range.update({ where: { id }, data: dto });
      });
    }

    const updatedCaiRange = await this.prisma.cAI_Range.update({
      where: { id },
      data: {
        range_start: dto.range_start,
        range_end: dto.range_end,
        expiration_date: dto.expiration_date,
        is_active: dto.is_active
      },
    });

    await this.auditService.createLog(
      userId,
      entities.CAI_RANGE,
      id,
      audit_action.UPDATE,
      `Rango ${currentRange.range_start}-${currentRange.range_end}`,
    );
    return updatedCaiRange;
  }

  async deactivateCaiRange(id: string, userId: string) {
    const currentRange = await this.findById(id);
    const newActiveStatus = !currentRange.is_active;

    if (newActiveStatus === true) {
      if (new Date() > new Date(currentRange.expiration_date)) {
        throw new BadRequestException('No se puede activar este rango porque ya expiró su fecha de validez.');
      }

      if (currentRange.current_invoice_number > currentRange.range_end) {
        throw new BadRequestException('No se puede activar este rango porque ya agotó su límite de facturas autorizado.');
      }

      const toggled = await this.prisma.$transaction(async (tx) => {
        const activeRange = await tx.cAI_Range.findFirst({ where: { is_active: true } });
        
        if (activeRange && activeRange.cai_id) {
          const activeRangeCaiId = activeRange.cai_id as string;
          await tx.cAI_Range.update({ where: { id: activeRange.id }, data: { is_active: false } });
          await tx.cAI.update({ where: { id: activeRangeCaiId }, data: { is_active: false } });
        }

        await tx.cAI.update({ where: { id: currentRange.cai_id as string }, data: { is_active: true } });

        return await tx.cAI_Range.update({
          where: { id },
          data: { is_active: true },
        });
      });

      await this.auditService.createLog(
        userId,
        entities.CAI_RANGE,
        id,
        audit_action.UPDATE,
        `Rango ${currentRange.range_start}-${currentRange.range_end}`,
      );
      return toggled;
    }

    const activeRangesCount = await this.prisma.cAI_Range.count({ where: { is_active: true } });
    if (activeRangesCount <= 1) {
      throw new BadRequestException(
        'No puedes apagar el rango activo. Crea un nuevo rango y haz clic en "Activar" para hacer el relevo de forma segura.'
      );
    }

    const toggledCaiRange = await this.prisma.cAI_Range.update({
      where: { id },
      data: { is_active: newActiveStatus },
    });

    await this.auditService.createLog(
      userId,
      entities.CAI_RANGE,
      id,
      audit_action.UPDATE,
      `Rango ${currentRange.range_start}-${currentRange.range_end}`,
    );
    return toggledCaiRange;
  }

  async getUniqueBaseCodes(): Promise<string[]> {
    return [this.HARDCODED_BASE_CODE];
  }

  private async validateOverlapping(
    baseCode: string,
    newStart: number,
    newEnd: number,
    cai_id: string,
    currentId?: string,
  ) {
    const existingRanges = await this.prisma.cAI_Range.findMany({
      where: { base_code: baseCode, cai_id: cai_id },
    });

    for (const range of existingRanges) {
      if (currentId && range.id === currentId) {
        continue;
      }

      const doesOverlap = newStart <= range.range_end && newEnd >= range.range_start;
      if (doesOverlap) {
        throw new ConflictException(
          `Conflicto de numeración: Los números se superponen con el rango registrado (${range.range_start} - ${range.range_end}). El nuevo bloque debe ir después del límite anterior.`,
        );
      }
    }
  }
}