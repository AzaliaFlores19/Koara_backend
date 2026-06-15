import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './create-client.dto';
import { UpdateClientDto } from './update-client.dto';
import { ClientFilterDto } from './client-filter.dto';
import { isUUID } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { audit_action, entities, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateClientDto, user_id: string) {
    if (dto.rtn) {
      const existing = await this.prisma.clients.findUnique({
        where: { rtn: dto.rtn },
      });
      if (existing) throw new ConflictException('El RTN ya está registrado.');
    }

    if (dto.email) {
      const existing = await this.prisma.clients.findUnique({
        where: { email: dto.email },
      });
      if (existing)
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
    }

    const client = await this.prisma.clients.create({ data: dto });
    await this.auditService.createLog(
      user_id,
      entities.CLIENTS,
      client.id,
      audit_action.CREATE,
    );
    return client;
  }

  async findAll(filter: ClientFilterDto) {
    const page = filter.page ? Math.max(1, parseInt(filter.page)) : 1;
    const limit = filter.limit ? Math.max(1, parseInt(filter.limit)) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientsWhereInput = { is_active: true };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { rtn: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.clients.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.clients.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getTotalUniqueClientsByDate(startDate: string, endDate: string) {
    const count = await this.prisma.clients.count({ where: {
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } });
    return { total_clients: count };
  }

  async findById(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('ID no válido');
    }

    const client = await this.prisma.clients.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto, user_id: string) {
    await this.findById(id);

    if (dto.rtn) {
      const duplicate = await this.prisma.clients.findFirst({
        where: { rtn: dto.rtn, id: { not: id } },
      });
      if (duplicate)
        throw new ConflictException('El RTN ya está en uso por otro cliente.');
    }

    if (dto.email) {
      const duplicate = await this.prisma.clients.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (duplicate)
        throw new ConflictException(
          'El correo electrónico ya está en uso por otro cliente.',
        );
    }

    const client = await this.prisma.clients.update({
      where: { id },
      data: dto,
    });
    await this.auditService.createLog(
      user_id,
      entities.CLIENTS,
      id,
      audit_action.UPDATE,
    );
    return client;
  }

  async deactivate(id: string, user_id: string) {
    await this.findById(id);
    const client = await this.prisma.clients.update({
      where: { id },
      data: { is_active: false },
    });
    await this.auditService.createLog(
      user_id,
      entities.CLIENTS,
      id,
      audit_action.DEACTIVATE,
    );
    return client;
  }

  async topProducts(id: string) {
    await this.findById(id);

    const items = await this.prisma.invoice_Product.findMany({
      where: { invoice: { client_id: id } },
      include: { product: true },
    });

    const productMap = new Map<
      string,
      { product: any; total_quantity: number }
    >();
    for (const item of items) {
      if (!item.product_id || !item.product) continue;
      const entry = productMap.get(item.product_id);
      if (entry) {
        entry.total_quantity += item.quantity;
      } else {
        productMap.set(item.product_id, {
          product: item.product,
          total_quantity: item.quantity,
        });
      }
    }

    return Array.from(productMap.values()).sort(
      (a, b) => b.total_quantity - a.total_quantity,
    );
  }

  async history(id: string) {
    await this.findById(id);
    return this.prisma.invoices.findMany({
      where: { client_id: id },
      include: { invoice_items: { include: { product: true } } },
      orderBy: { created_at: 'desc' },
    });
  }
}
