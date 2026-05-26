import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceItemsService } from './invoice-items.service';
import { entities, audit_action, Prisma } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly invoiceItemsService: InvoiceItemsService,
  ) {}

  calculateTotal(items: { item_subtotal: Prisma.Decimal }[], taxRate: number) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.item_subtotal.toNumber(),
      0,
    );
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes;
    return { subtotal, taxes, total };
  }

  generateInvoiceNumber(baseCode: string, currentNumber: number) {
    return `${baseCode}${currentNumber.toString().padStart(8, '0')}`;
  }

  async createInvoice(dto: CreateInvoiceDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.clients.findUnique({
        where: { id: dto.customerId },
      });
      if (!client) throw new NotFoundException('Cliente no encontrado');

      const caiRange = await tx.cAI_Range.findUnique({
        where: { id: dto.caiRangeId },
      });
      if (!caiRange) {
        throw new NotFoundException('Rango CAI no encontrado');
      }
      if (!caiRange.is_active) {
        throw new BadRequestException('El Rango CAI seleccionado no está activo');
      }
      if (caiRange.current_invoice_number > caiRange.range_end) {
        throw new BadRequestException('El Rango CAI ha alcanzado su límite de facturas');
      }
      if (new Date() > new Date(caiRange.expiration_date)) {
        throw new BadRequestException('El Rango CAI ha expirado');
      }

      const invoice_number = this.generateInvoiceNumber(
        caiRange.base_code,
        caiRange.current_invoice_number,
      );

      const precalcItems: { item_subtotal: Prisma.Decimal }[] = [];
      for (const item of dto.items) {
        const product = await tx.products.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para el producto ${product.name}`,
          );
        }
        const item_subtotal = new Prisma.Decimal(
          product.price.toNumber() * item.quantity,
        );
        if (item_subtotal.toNumber() <= 0) {
          throw new BadRequestException(
            `Subtotal invalido para el producto ${product.name}`,
          );
        }
        precalcItems.push({ item_subtotal });
      }

      const taxRate = dto.taxRate ?? 0.15;
      const { subtotal, taxes, total } = this.calculateTotal(
        precalcItems,
        taxRate,
      );

      const invoice = await tx.invoices.create({
        data: {
          invoice_number,
          cai_range_id: caiRange.id,
          client_id: client.id,
          user_id: userId,
          client_name: client.name,
          client_rtn: client.rtn,
          client_phone: client.phone,
          client_email: client.email,
          subtotal,
          taxes,
          total,
          payment_method: dto.payment_method,
        },
      });

      await this.invoiceItemsService.createItems(
        invoice.id,
        dto.items,
        userId,
        tx,
      );

      await tx.cAI_Range.update({
        where: { id: caiRange.id },
        data: {
          current_invoice_number: { increment: 1 },
        },
      });

      await this.auditService.createLog(
        userId,
        entities.INVOICES,
        invoice.id,
        audit_action.CREATE,
      );

      return invoice;
    });
  }

  async findAll(filters: {
    customerId?: string;
    cashierId?: string;
    issuedAtStart?: string;
    issuedAtEnd?: string;
  }) {
    const where: Prisma.InvoicesWhereInput = {};

    if (filters.customerId) {
      where.client_id = filters.customerId;
    }
    if (filters.cashierId) {
      where.user_id = filters.cashierId;
    }
    if (filters.issuedAtStart || filters.issuedAtEnd) {
      where.created_at = {};
      if (filters.issuedAtStart)
        where.created_at.gte = new Date(filters.issuedAtStart);
      if (filters.issuedAtEnd)
        where.created_at.lte = new Date(filters.issuedAtEnd);
    }

    return this.prisma.invoices.findMany({
      where,
      include: { client: true, user: true },
    });
  }

  async findActive(filters: {
    customerId?: string;
    cashierId?: string;
    issuedAtStart?: string;
    issuedAtEnd?: string;
  }) {
    const where: Prisma.InvoicesWhereInput = {};

    if (filters.customerId) {
      where.client_id = filters.customerId;
    }
    if (filters.cashierId) {
      where.user_id = filters.cashierId;
    }
    if (filters.issuedAtStart || filters.issuedAtEnd) {
      where.created_at = {};
      if (filters.issuedAtStart)
        where.created_at.gte = new Date(filters.issuedAtStart);
      if (filters.issuedAtEnd)
        where.created_at.lte = new Date(filters.issuedAtEnd);
    }

    return this.prisma.invoices.findMany({
      where,
      include: { client: true, user: true },
    });
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        invoice_items: { include: { product: true } },
        client: true,
        user: true,
        cai_range: true,
      },
    });

    if (!invoice) throw new NotFoundException('Factura no encontrada');

    return invoice;
  }

  async cancelInvoice(id: string, userId: string) {
    const invoice = await this.prisma.invoices.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    return this.prisma.$transaction(async (tx) => {
      const items = await this.invoiceItemsService.findByInvoiceId(id);
      for (const item of items) {
        if (!item.product_id) continue;
        const product = await tx.products.findUnique({
          where: { id: item.product_id },
        });
        if (product) {
          await tx.products.update({
            where: { id: product.id },
            data: { stock: product.stock + item.quantity },
          });
        }
      }

      await this.invoiceItemsService.deleteItems(invoice.id, userId, tx);

      const deletedInvoice = await tx.invoices.delete({
        where: { id: invoice.id },
      });

      await this.auditService.createLog(
        userId,
        entities.INVOICES,
        invoice.id,
        audit_action.DEACTIVATE,
      );

      return deletedInvoice;
    });
  }
}
