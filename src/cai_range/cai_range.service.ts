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
  const activeRange = await this.prisma.cAI_Range.findFirst({
    where: { is_active: true },
    include: {
      cai: true, 
    },
  });
    return activeRange;
  }
   
}
