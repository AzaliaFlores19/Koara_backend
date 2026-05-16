import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaiDto } from './create-cai-dto';
import { UpdateCaiDto } from './update-cai-dto';

@Injectable()
export class CaiService {
  constructor(private prisma: PrismaService) {}

async create(createCaiDto: CreateCaiDto) {
    const existingCai = await this.prisma.cAI.findUnique({
        where: { cai_code: createCaiDto.cai_code },
    });
    if (existingCai) {
        throw new ConflictException('El código CAI ya existe.');
    }
    return this.prisma.cAI.create({
      data: {
        cai_code: createCaiDto.cai_code,
        is_active: true,
      },
    });
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

    async updateCai(id: string, dto: UpdateCaiDto) {
    await this.findById(id);

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

    return this.prisma.cAI.update({
      where: { id },
      data: dto,
    });
  }

  async deactivateCai(id: string) {
    await this.findById(id);

    return this.prisma.cAI.update({
      where: { id },
      data: { is_active: false },
    });
  }
}