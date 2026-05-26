import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  entities,
  audit_action,
  Prisma,
  Invoice_Product,
} from '@prisma/client';

@Injectable()
export class InvoiceItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createItems(
    invoiceId: string,
    items: { productId: string; quantity: number }[],
    userId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const createdItems: Invoice_Product[] = [];

    for (const item of items) {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `Producto con ID ${item.productId} no encontrado`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${product.name}`,
        );
      }

      const unit_price = product.price;
      const item_subtotal = new Prisma.Decimal(
        unit_price.toNumber() * item.quantity,
      );

      const invoiceProduct = await tx.invoice_Product.create({
        data: {
          invoice_id: invoiceId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: unit_price,
          item_subtotal: item_subtotal,
        },
      });

      await tx.products.update({
        where: { id: product.id },
        data: {
          stock: product.stock - item.quantity,
        },
      });

      createdItems.push(invoiceProduct);

      await this.auditService.createLog(
        userId,
        entities.INVOICE_PRODUCTS,
        invoiceProduct.id,
        audit_action.CREATE,
      );
    }

    return createdItems;
  }

  async findByInvoiceId(invoiceId: string) {
    const items = await this.prisma.invoice_Product.findMany({
      where: { invoice_id: invoiceId },
      include: {
        product: true,
      },
    });

    return items;
  }

  async deleteItems(
    invoiceId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const items = await tx.invoice_Product.findMany({
      where: { invoice_id: invoiceId },
    });

    const result = await tx.invoice_Product.deleteMany({
      where: { invoice_id: invoiceId },
    });

    for (const item of items) {
      await this.auditService.createLog(
        userId,
        entities.INVOICE_PRODUCTS,
        item.id,
        audit_action.DEACTIVATE,
      );
    }

    return result;
  }
}
