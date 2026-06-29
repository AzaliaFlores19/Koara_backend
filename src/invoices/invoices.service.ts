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

interface InvoicePdfItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoicePdfData {
  // Discrimina entre una vista previa y la impresión de una factura real.
  isPreview: boolean;
  invoiceNumber?: string;
  date: Date;
  caiCode?: string | null;
  caiExpiration?: Date | null;
  rangeStart?: number;
  rangeEnd?: number;
  company?: {
    name: string;
    rtn: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  client: {
    name: string;
    rtn?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  paymentMethod?: string;
  items: InvoicePdfItem[];
  subtotal: number;
  taxes: number;
  total: number;
}

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
    return `${baseCode}-${currentNumber.toString().padStart(8, '0')}`;
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
        const company = await tx.company.findFirst();
        return this.buildInvoicePdf({
          isPreview: true,
          date: new Date(),
          company,
          client: {
            name: client.name,
            rtn: client.rtn,
            phone: client.phone,
            email: client.email,
          },
          paymentMethod: dto.payment_method,
          items: precalcItems.map((p) => ({
            name: p.product.name,
            quantity: p.quantity,
            unitPrice: p.product.price.toNumber(),
            subtotal: p.item_subtotal.toNumber(),
          })),
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
        user: { select: { id: true, name: true } },
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
        user: { select: { id: true, name: true } },
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

  /**
   * Genera el PDF imprimible de una factura ya emitida (documento real),
   * a diferencia de la vista previa que se genera durante la creación.
   */
  async generateInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        invoice_items: { include: { product: true } },
        cai_range: { include: { cai: true } },
      },
    });

    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const company = await this.prisma.company.findFirst();

    return this.buildInvoicePdf({
      isPreview: false,
      invoiceNumber: invoice.invoice_number,
      date: invoice.created_at,
      caiCode: invoice.cai_range?.cai?.cai_code ?? null,
      caiExpiration: invoice.cai_range?.expiration_date ?? null,
      rangeStart: invoice.cai_range?.range_start,
      rangeEnd: invoice.cai_range?.range_end,
      company,
      client: {
        name: invoice.client_name,
        rtn: invoice.client_rtn,
        phone: invoice.client_phone,
        email: invoice.client_email,
      },
      paymentMethod: invoice.payment_method,
      items: invoice.invoice_items.map((it) => ({
        name: it.product?.name ?? 'Producto',
        quantity: it.quantity,
        unitPrice: it.unit_price?.toNumber() ?? 0,
        subtotal: it.item_subtotal?.toNumber() ?? 0,
      })),
      subtotal: invoice.subtotal.toNumber(),
      taxes: invoice.taxes.toNumber(),
      total: invoice.total.toNumber(),
    });
  }

  /**
   * Constructor único del PDF. El flag `isPreview` decide el branding
   * (marca de agua "VISTA PREVIA", número de factura pendiente, sin CAI)
   * frente a una factura real (CAI, número emitido, leyenda fiscal).
   */
  private buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Paleta en blanco y negro (escala de grises, sin color).
      const DARK = '#000000'; // negro principal
      const PINK = '#FFFFFF'; // texto/acento sobre fondo negro
      const PINK_DARK = '#000000'; // etiquetas (negro)
      const GRAY = '#555555'; // texto secundario (gris)
      const LINE = '#999999'; // línea/borde gris
      const BOX = '#F0F0F0'; // fondo de cajas (gris claro)
      const ZEBRA = '#F5F5F5'; // fondo de filas alternas (gris muy claro)

      const pageW = doc.page.width;
      const left = doc.page.margins.left;
      const right = pageW - doc.page.margins.right;
      const width = right - left;

      const money = (n: number) =>
        'L ' + (n ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      const pad = (n: number) => String(n).padStart(2, '0');
      const fmtDate = (d: Date, withTime = true) => {
        const dt = new Date(d);
        const date = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
        return withTime ? `${date} ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : date;
      };

      const paymentLabels: Record<string, string> = {
        CASH: 'Efectivo',
        TRANSFER: 'Transferencia',
        CARD: 'Tarjeta',
      };

      // ===== Encabezado =====
      doc.rect(0, 0, pageW, 120).fill(DARK);
      // Franja de separación gris bajo el encabezado.
      doc.rect(0, 120, pageW, 3).fill(GRAY);
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(26)
        .text((data.company?.name || 'KOARA').toUpperCase(), left, 34, {
          width: width - 170,
        });

      const infoLines: string[] = [];
      if (data.company?.rtn) infoLines.push(`RTN: ${data.company.rtn}`);
      if (data.company?.address) infoLines.push(data.company.address);
      const contact = [data.company?.phone, data.company?.email]
        .filter(Boolean)
        .join('  •  ');
      if (contact) infoLines.push(contact);
      if (infoLines.length) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(PINK)
          .text(infoLines.join('\n'), left, 70, { width: width - 170 });
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#FFFFFF')
        .text('FACTURA', right - 200, 38, { width: 200, align: 'right' });
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(PINK)
        .text(
          data.isPreview ? 'VISTA PREVIA' : 'ORIGINAL: CLIENTE',
          right - 200,
          74,
          {
            width: 200,
            align: 'right',
          },
        );
      if (!data.isPreview) {
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(PINK)
          .text('Copia: Obligado tributario emisor', right - 200, 90, {
            width: 200,
            align: 'right',
          });
      }

      // ===== Cliente + Metadatos =====
      let y = 150;
      const gap = 16;
      const colW = (width - gap) / 2;

      const metaRows: [string, string][] = [
        [
          'No. FACTURA',
          data.isPreview ? 'PENDIENTE' : data.invoiceNumber || '—',
        ],
        ['FECHA', fmtDate(data.date)],
        [
          'MÉTODO DE PAGO',
          paymentLabels[data.paymentMethod ?? ''] ?? data.paymentMethod ?? '—',
        ],
      ];
      if (!data.isPreview && data.caiCode) metaRows.push(['CAI', data.caiCode]);

      const boxH = 26 + metaRows.length * 20;

      // Caja izquierda: Facturar a
      doc.roundedRect(left, y, colW, boxH, 8).fill(BOX);
      doc
        .fillColor(PINK_DARK)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('FACTURAR A', left + 12, y + 12, { characterSpacing: 1 });
      doc
        .fillColor(DARK)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(data.client.name || '—', left + 12, y + 26, {
          width: colW - 24,
        });
      const clientLines: string[] = [];
      if (data.client.rtn) clientLines.push(`RTN: ${data.client.rtn}`);
      if (data.client.phone) clientLines.push(`Tel: ${data.client.phone}`);
      if (data.client.email) clientLines.push(data.client.email);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(GRAY)
        .text(clientLines.join('\n') || 'Consumidor final', left + 12, y + 46, {
          width: colW - 24,
        });

      // Caja derecha: metadatos
      const rx = left + colW + gap;
      doc.roundedRect(rx, y, colW, boxH, 8).fill(BOX);
      let my = y + 14;
      metaRows.forEach(([label, value]) => {
        doc
          .fillColor(PINK_DARK)
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(label, rx + 12, my, { width: colW - 24 });
        doc
          .fillColor(DARK)
          .font('Helvetica')
          .fontSize(9.5)
          .text(value, rx + 12, my + 9, { width: colW - 24 });
        my += 20;
      });

      y += boxH + 28;

      // ===== Tabla de items =====
      const cProd = left + 10;
      const cQty = left + 285;
      const cPrice = left + 345;
      const cSub = left + 425;
      const wQty = 55;
      const wPrice = 75;
      const wSub = width - (cSub - left) - 10;

      const drawHeader = (hy: number) => {
        doc.rect(left, hy, width, 26).fill(DARK);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
        doc.text('PRODUCTO', cProd, hy + 9);
        doc.text('CANT.', cQty, hy + 9, { width: wQty, align: 'center' });
        doc.text('PRECIO', cPrice, hy + 9, { width: wPrice, align: 'right' });
        doc.text('SUBTOTAL', cSub, hy + 9, { width: wSub, align: 'right' });
        return hy + 26;
      };

      y = drawHeader(y);

      doc.font('Helvetica').fontSize(9.5);
      data.items.forEach((item, i) => {
        const rh = 22;
        if (y + rh > doc.page.height - 130) {
          doc.addPage();
          y = drawHeader(60);
          doc.font('Helvetica').fontSize(9.5);
        }
        if (i % 2 === 1) doc.rect(left, y, width, rh).fill(ZEBRA);
        doc
          .fillColor(DARK)
          .font('Helvetica')
          .text(item.name, cProd, y + 7, {
            width: cQty - cProd - 6,
            ellipsis: true,
          });
        doc
          .fillColor(GRAY)
          .text(String(item.quantity), cQty, y + 7, {
            width: wQty,
            align: 'center',
          });
        doc.text(money(item.unitPrice), cPrice, y + 7, {
          width: wPrice,
          align: 'right',
        });
        doc
          .fillColor(DARK)
          .font('Helvetica-Bold')
          .text(money(item.subtotal), cSub, y + 7, {
            width: wSub,
            align: 'right',
          });
        doc.font('Helvetica');
        y += rh;
      });

      doc
        .moveTo(left, y)
        .lineTo(right, y)
        .lineWidth(1)
        .strokeColor(LINE)
        .stroke();

      // ===== Totales =====
      y += 18;
      const tW = 220;
      const tX = right - tW;
      const totalsRows: [string, string][] = [
        ['Subtotal', money(data.subtotal)],
        ['ISV (15%)', money(data.taxes)],
      ];
      totalsRows.forEach(([label, value]) => {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(GRAY)
          .text(label, tX, y, { width: tW / 2 });
        doc
          .fillColor(DARK)
          .text(value, tX + tW / 2, y, { width: tW / 2, align: 'right' });
        y += 18;
      });
      doc.roundedRect(tX, y, tW, 30, 6).fill(DARK);
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('TOTAL', tX + 12, y + 9);
      doc.text(money(data.total), tX, y + 9, {
        width: tW - 12,
        align: 'right',
      });

      // ===== Pie de página =====
      // Se deja margen suficiente para que la última línea no rebase el
      // margen inferior y PDFKit no inserte una página extra.
      const footerY = doc.page.height - 95;
      doc
        .moveTo(left, footerY)
        .lineTo(right, footerY)
        .lineWidth(1)
        .strokeColor(LINE)
        .stroke();
      doc.font('Helvetica').fontSize(8).fillColor(GRAY);
      if (data.isPreview) {
        doc.text(
          'DOCUMENTO SIN VALIDEZ FISCAL — VISTA PREVIA',
          left,
          footerY + 12,
          { width, align: 'center' },
        );
      } else {
        const parts: string[] = [];
        if (data.caiCode) parts.push(`CAI: ${data.caiCode}`);
        if (data.caiExpiration)
          parts.push(
            `Fecha límite de emisión: ${fmtDate(data.caiExpiration, false)}`,
          );
        if (
          typeof data.rangeStart === 'number' &&
          typeof data.rangeEnd === 'number'
        ) {
          // El rango se muestra como un número de factura completo:
          // prefijo (establecimiento-punto-tipo) + 8 dígitos del correlativo.
          const dashAt = data.invoiceNumber?.lastIndexOf('-') ?? -1;
          const prefix =
            dashAt > 0 ? data.invoiceNumber!.slice(0, dashAt + 1) : '';
          const fmtRange = (n: number) => prefix + String(n).padStart(8, '0');
          parts.push(
            `Rango autorizado: ${fmtRange(data.rangeStart)} - ${fmtRange(data.rangeEnd)}`,
          );
        }
        if (parts.length)
          doc.text(parts.join('   |   '), left, footerY + 8, {
            width,
            align: 'center',
            lineBreak: false,
          });
      }

      // Marca de agua de vista previa (encima del contenido, sutil).
      if (data.isPreview) {
        doc.save();
        doc.rotate(-40, { origin: [pageW / 2, doc.page.height / 2] });
        doc
          .font('Helvetica-Bold')
          .fontSize(90)
          .fillColor(GRAY)
          .fillOpacity(0.18)
          .text('VISTA PREVIA', pageW / 2 - 320, doc.page.height / 2 - 50, {
            width: 640,
            align: 'center',
          });
        doc.fillOpacity(1).restore();
      }

      doc.end();
    });
  }
}
