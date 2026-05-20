import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaiRangeDto } from './create-cai-range.dto';
import { UpdateCaiRangeDto } from './update-cai-range.dto';

@Injectable()
export class CaiRangeService {
  constructor(private prisma: PrismaService) {}

  async createCaiRange(dto: CreateCaiRangeDto) {
    const existingCai = await this.prisma.cAI.findUnique({ where: { id: dto.cai_id } });
    if (!existingCai) {
      throw new NotFoundException('El CAI asociado no existe.');
    }

    if (dto.range_start >= dto.range_end) {
      throw new BadRequestException('El rango inicial debe ser menor que el rango final');
    }

    if (new Date(dto.expiration_date) <= new Date()) {
      throw new BadRequestException('La fecha de expiración debe ser una fecha futura.');
    }

    const activeRange = await this.prisma.cAI_Range.findFirst({
      where: { cai_id: dto.cai_id, is_active: true },
    });
    if (activeRange) {
      throw new ConflictException('Ya existe un rango activo para este CAI. Desactívalo antes de crear uno nuevo.');
    }

    await this.validateOverlapping(dto.base_code, dto.range_start, dto.range_end);

    return this.prisma.cAI_Range.create({
      data: {
        ...dto,
        current_invoice_number: dto.range_start,
        is_active: true,
      },
    });
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
    const activeRanges = await this.prisma.cAI_Range.findMany({
      where: { is_active: true },
      include: { cai: true },
    });
    return activeRanges;
  }

  async updateCaiRange(id: string, dto: UpdateCaiRangeDto) {

    const currentRange = await this.findById(id);
    const updateRange ={ ...currentRange, ...dto };
    const start=updateRange.range_start;
    const end=updateRange.range_end;
    const baseCode=updateRange.base_code;

    if (start >= end) {
      throw new BadRequestException('El rango inicial debe ser menor que el rango final.');
    }

    if (dto.range_start || dto.range_end || dto.base_code) {
      await this.validateOverlapping(baseCode, start, end, id);
    }

    if (dto.is_active === true && !currentRange.is_active) {
      const activeRange = await this.prisma.cAI_Range.findFirst({
        where: { cai_id: currentRange.cai_id, is_active: true, id: { not: id } },
      });
      if (activeRange) {
        throw new ConflictException('Ya existe otro rango activo para este CAI.');
      }
    }

    return this.prisma.cAI_Range.update({
      where: { id },
      data: dto,
    });
  }

  async deactivateCaiRange(id: string) {
    await this.findById(id);
    return this.prisma.cAI_Range.update({
      where: { id },
      data: { is_active: false },
    });
  }

    private async validateOverlapping (baseCode: string, newStart: number, newEnd: number, currentId?: string) {
    const existingRanges = await this.prisma.cAI_Range.findMany({
        where: { 
        base_code: baseCode 
        },
    });

    for (const range of existingRanges) {
        if (currentId && range.id === currentId) {
        continue;
        }

        const doesOverlap = newStart <= range.range_end && newEnd >= range.range_start;
        if (doesOverlap) {
        throw new ConflictException(
            `Conflicto de numeración: Los números del rango se superponen con un rango existente  (${range.range_start} - ${range.range_end}).`
        );
        }
    }
    }
}