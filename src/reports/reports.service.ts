import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isUUID } from 'class-validator';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesByDateRange(startDate: string, endDate: string) {
    const invoices = await this.prisma.invoices.findMany({
      where: {
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        created_at: true,
        total: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const dailyMap = new Map<
      string,
      { date: string; total_sales: number; invoice_count: number }
    >();

    for (const invoice of invoices) {
      const day = invoice.created_at.toISOString().split('T')[0];
      const entry = dailyMap.get(day);
      if (entry) {
        entry.total_sales += invoice.total.toNumber();
        entry.invoice_count += 1;
      } else {
        dailyMap.set(day, {
          date: day,
          total_sales: invoice.total.toNumber(),
          invoice_count: 1,
        });
      }
    }

    return Array.from(dailyMap.values());
  }

  async getTopSellingProducts(
    limit: number,
    range: { startDate: string; endDate: string },
  ) {
    const grouped = await this.prisma.invoice_Product.groupBy({
      by: ['product_id'],
      where: {
        invoice: {
          created_at: {
            gte: new Date(range.startDate),
            lte: new Date(range.endDate),
          },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = grouped
      .map((g) => g.product_id)
      .filter(Boolean) as string[];

    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, code_bar: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => ({
      product: productMap.get(g.product_id!),
      total_quantity_sold: g._sum.quantity ?? 0,
    }));
  }

  async getFrequentCustomers(limit: number) {
    const grouped = await this.prisma.invoices.groupBy({
      by: ['client_id'],
      _count: { id: true },
      _sum: { total: true },
      orderBy: [{ _count: { id: 'desc' } }, { _sum: { total: 'desc' } }],
      take: limit,
    });

    const clientIds = grouped
      .map((g) => g.client_id)
      .filter(Boolean) as string[];

    const clients = await this.prisma.clients.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true, phone: true },
    });

    const clientMap = new Map(clients.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      client: clientMap.get(g.client_id!),
      invoice_count: g._count.id,
      total_spent: g._sum.total?.toNumber() ?? 0,
    }));
  }

  async getCustomerPurchaseHistory(customerId: string) {
    if (!isUUID(customerId)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    const client = await this.prisma.clients.findUnique({
      where: { id: customerId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const invoices = await this.prisma.invoices.findMany({
      where: { client_id: customerId },
      include: {
        invoice_items: {
          include: { product: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { client, invoices };
  }
}
