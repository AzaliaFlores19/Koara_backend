import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './create-client.dto';
import { UpdateClientDto } from './update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  private async createAuditLog(
    user_id: string,
    entity_id: string,
    action: 'CREATE' | 'UPDATE' | 'DEACTIVATE',
  ) {
    await this.prisma.audit_Logs.create({
      data: { user_id, entity: 'CLIENTS', entity_id, action },
    });
  }

  async create(dto: CreateClientDto, user_id: string) {
    if (dto.rtn) {
      const existing = await this.prisma.clients.findUnique({ where: { rtn: dto.rtn } });
      if (existing) throw new ConflictException('El RTN ya está registrado.');
    }

    if (dto.email) {
      const existing = await this.prisma.clients.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const client = await this.prisma.clients.create({ data: dto });
    await this.createAuditLog(user_id, client.id, 'CREATE');
    return client;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.clients.findMany({ skip, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.clients.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const client = await this.prisma.clients.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado.');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user_id: string) {
    await this.findById(id);

    if (dto.rtn) {
      const duplicate = await this.prisma.clients.findFirst({
        where: { rtn: dto.rtn, id: { not: id } },
      });
      if (duplicate) throw new ConflictException('El RTN ya está en uso por otro cliente.');
    }

    if (dto.email) {
      const duplicate = await this.prisma.clients.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (duplicate) throw new ConflictException('El correo electrónico ya está en uso por otro cliente.');
    }

    const client = await this.prisma.clients.update({ where: { id }, data: dto });
    await this.createAuditLog(user_id, id, 'UPDATE');
    return client;
  }

  async deactivate(id: string, user_id: string) {
    await this.findById(id);
    const client = await this.prisma.clients.update({ where: { id }, data: { is_active: false } });
    await this.createAuditLog(user_id, id, 'DEACTIVATE');
    return client;
  }

  async topProducts(id: string) {
    await this.findById(id);

    const items = await this.prisma.invoice_Product.findMany({
      where: { invoice: { client_id: id } },
      include: { product: true },
    });

    const productMap = new Map<string, { product: any; total_quantity: number }>();
    for (const item of items) {
      if (!item.product_id || !item.product) continue;
      const entry = productMap.get(item.product_id);
      if (entry) {
        entry.total_quantity += item.quantity;
      } else {
        productMap.set(item.product_id, { product: item.product, total_quantity: item.quantity });
      }
    }

    return Array.from(productMap.values()).sort((a, b) => b.total_quantity - a.total_quantity);
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
