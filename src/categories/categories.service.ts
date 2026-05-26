import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { isUUID } from 'class-validator';
import { entities, audit_action } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async createAuditLog(
    user_id: string,
    entity_id: string,
    action: audit_action,
  ) {
    await this.auditService.createLog(
      user_id,
      entities.CATEGORY,
      entity_id,
      action,
    );
  }

  async create(dto: CreateCategoryDto, user_id: string) {
    const existing = await this.prisma.categories.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException('El nombre de la categoría ya existe.');

    const category = await this.prisma.categories.create({ data: dto });
    await this.createAuditLog(user_id, category.id, 'CREATE');
    return category;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.categories.findMany({
        where: { is_active: true },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.categories.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('ID no válido');
    }

    const category = await this.prisma.categories.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, user_id: string) {
    await this.findOne(id);

    if (dto.name) {
      const duplicate = await this.prisma.categories.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (duplicate)
        throw new ConflictException(
          'El nombre de la categoría ya está en uso.',
        );
    }

    const category = await this.prisma.categories.update({
      where: { id },
      data: dto,
    });
    await this.createAuditLog(user_id, id, 'UPDATE');
    return category;
  }

  async deactivate(id: string, user_id: string) {
    await this.findOne(id);
    const category = await this.prisma.categories.update({
      where: { id },
      data: { is_active: false },
    });
    await this.createAuditLog(user_id, id, 'DEACTIVATE');
    return category;
  }
}
