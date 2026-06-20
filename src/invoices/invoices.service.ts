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
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import PDFDocument from 'pdfkit';

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

  async createInvoice(
    dto: CreateInvoiceDto,
    userId: string,
    isPreview: boolean = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const caiRange = await tx.cAI_Range.findFirst({
        where: {
          is_active: true,
        },
      });
      if (!caiRange) {
        throw new NotFoundException('No se encontró un rango CAI activo');
      }

      const client = await tx.clients.findUnique({
        where: { id: dto.customerId },
      });
      if (!client) throw new NotFoundException('Cliente no encontrado');

      if (caiRange.current_invoice_number > caiRange.range_end) {
        throw new BadRequestException(
          'El Rango CAI ha alcanzado su límite de facturas',
        );
      }
      if (new Date() > new Date(caiRange.expiration_date)) {
        throw new BadRequestException('El Rango CAI ha expirado');
      }
      let invoice_number = '';

      if (!isPreview) {
        invoice_number = this.generateInvoiceNumber(
          caiRange.base_code,
          caiRange.current_invoice_number,
        );
      }

      const precalcItems: {
        item_subtotal: Prisma.Decimal;
        product: any;
        quantity: number;
      }[] = [];
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
        precalcItems.push({ item_subtotal, product, quantity: item.quantity });
      }

      const taxRate = dto.taxRate ?? 0.15;
      const { subtotal, taxes, total } = this.calculateTotal(
        precalcItems,
        taxRate,
      );

      if (isPreview) {
        return this.generatePdfBuffer({
          date: new Date(),
          client,
          items: precalcItems,
          subtotal,
          taxes,
          total,
        });
      }

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
        `Factura ${invoice.invoice_number}`,
      );

      const {
        client_id,
        user_id,
        client_name,
        client_rtn,
        client_phone,
        client_email,
        ...InvoiceInfo
      } = invoice;

      return InvoiceInfo;
    });
  }

  async findAll(filters: InvoiceFiltersDto) {
    const where: Prisma.InvoicesWhereInput = {};

    if (filters.customerId) {
      where.client_id = filters.customerId;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.created_at.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    if (filters.minTotal || filters.maxTotal) {
      where.total = {};
      if (filters.minTotal) where.total.gte = filters.minTotal;
      if (filters.maxTotal) where.total.lte = filters.maxTotal;
    }

    return this.prisma.invoices.findMany({
      where,
      include: {
        client: true,
      },
    });
  }

  async findActive(filters: InvoiceFiltersDto) {
    const where: Prisma.InvoicesWhereInput = {};

    if (filters.customerId) {
      where.client_id = filters.customerId;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.created_at.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    if (filters.minTotal || filters.maxTotal) {
      where.total = {};
      if (filters.minTotal) where.total.gte = filters.minTotal;
      if (filters.maxTotal) where.total.lte = filters.maxTotal;
    }

    return this.prisma.invoices.findMany({
      where,
    });
  }

  async getTotalSalesByDateRange(startDate: string, endDate: string) {
    const aggregations = await this.prisma.invoices.aggregate({
      where: {
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        subtotal: true,
        taxes: true,
        total: true,
      },
    });

    return {
      total_sales_before_taxes: aggregations._sum.subtotal,
      total_taxes: aggregations._sum.taxes,
      total_sales_after_taxes: aggregations._sum.total,
      total_invoices: aggregations._count.id,
    };
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        invoice_items: { include: { product: true } },
        user: false,
        cai_range: false,
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
        `Factura ${invoice.invoice_number}`,
      );

      return deletedInvoice;
    });
  }

  private generatePdfBuffer(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
      doc.fontSize(20).text('FACTURA PREVIEW', { align: 'center' }).moveDown();
      doc
        .fontSize(12)
        .text(`Fecha: ${data.date.toLocaleDateString()}`)
        .moveDown();
      doc
        .text('Informacion Cliente:')
        .text(`Nombre: ${data.client.name}`)
        .text(`RTN: ${data.client.rtn}`)
        .text(`Telefono: ${data.client.phone}`)
        .text(`Email: ${data.client.email}`)
        .moveDown();
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Producto', 50, tableTop);
      doc.text('Cantidad', 300, tableTop);
      doc.text('Precio', 380, tableTop);
      doc.text('Subtotal', 460, tableTop);
      doc.font('Helvetica');

      let yPosition = tableTop + 20;
      data.items.forEach((item: any) => {
        doc.text(item.product.name, 50, yPosition);
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(
          `$${item.product.price.toNumber().toFixed(2)}`,
          380,
          yPosition,
        );
        doc.text(
          `$${item.item_subtotal.toNumber().toFixed(2)}`,
          460,
          yPosition,
        );
        yPosition += 20;
      });

      doc.moveDown(2);
      const totalsX = 350;
      yPosition = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', totalsX, yPosition);
      doc
        .font('Helvetica')
        .text(`$${data.subtotal.toFixed(2)}`, 460, yPosition);
      yPosition += 20;

      doc.font('Helvetica-Bold');
      doc.text('ISV:', totalsX, yPosition);
      doc.font('Helvetica').text(`$${data.taxes.toFixed(2)}`, 460, yPosition);
      yPosition += 20;

      doc.font('Helvetica-Bold');
      doc.text('Total:', totalsX, yPosition);
      doc.font('Helvetica').text(`$${data.total.toFixed(2)}`, 460, yPosition);

      doc.end();
    });
  }
}
