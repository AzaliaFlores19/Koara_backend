import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaiDto } from './create-cai-dto';
import { UpdateCaiDto } from './update-cai-dto';
import { AuditService } from '../audit/audit.service';
import { audit_action, entities } from '@prisma/client';

@Injectable()
export class CaiService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

async create(createCaiDto: CreateCaiDto, userId: string) {
    const existingCai = await this.prisma.cAI.findUnique({
        where: { cai_code: createCaiDto.cai_code },
    });
    if (existingCai) {
        throw new ConflictException('El código CAI ya existe.');
    }

    const activeCai = await this.prisma.cAI.findFirst({
      where: { is_active: true }
    });
    if (activeCai) {
      throw new ConflictException(
        `Ya existe un código CAI activo (${activeCai.cai_code}). Debes desactivarlo antes de crear o activar uno nuevo.`
      );
    }

    const cai = await this.prisma.cAI.create({
      data: {
        cai_code: createCaiDto.cai_code,
        is_active: true,
      },
    });

    await this.auditService.createLog(userId, entities.CAI, cai.id, audit_action.CREATE);

    return cai;
  }

  async findAll() {
    return this.prisma.cAI.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    const cai = await this.prisma.cAI.findUnique({ where: { id } });
    if (!cai) throw new NotFoundException('CAI no encontrado');
    return cai;
  }

    async updateCai(id: string, dto: UpdateCaiDto, userId: string) {
   const currentCai = await this.findById(id);

    if (dto.cai_code) {
      const duplicateCai = await this.prisma.cAI.findFirst({
        where: {
          cai_code: dto.cai_code,
          id: { not: id },
        },
      });
      if (duplicateCai) {
        throw new ConflictException('El código CAI ya está en uso por otro registro.');
      }
    }

    if (dto.is_active === true && !currentCai.is_active) {
      const activeCai = await this.prisma.cAI.findFirst({
        where: {
          is_active: true,
          id: { not: id }
        }
      });
      if (activeCai) {
        throw new ConflictException(
          `No puedes activar este CAI porque el código ${activeCai.cai_code} ya se encuentra activo actualmente.`
        );
      }
    }

    const updatedCai = await this.prisma.cAI.update({
      where: { id },
      data: dto,
    });

    await this.auditService.createLog(userId, entities.CAI, id, audit_action.UPDATE);

    return updatedCai;
  }

  async deactivateCai(id: string, userId: string) {
    await this.findById(id);

    const deactivatedCai = await this.prisma.cAI.update({
      where: { id },
      data: { is_active: false },
    });

    await this.auditService.createLog(userId, entities.CAI, id, audit_action.DEACTIVATE);

    return deactivatedCai;
  }
}