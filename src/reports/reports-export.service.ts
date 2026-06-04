import { BadRequestException, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { ReportsService } from './reports.service';

type ExportFormat = 'pdf' | 'csv';
type ReportType =
  | 'sales'
  | 'top-products'
  | 'frequent-customers'
  | 'monthly-sales'
  | 'customer-history';

type ReportFilters = {
  startDate?: string;
  endDate?: string;
  limit?: string;
  customerId?: string;
  clientId?: string;
};

type ExportPayload = {
  filename: string;
  contentType: string;
  buffer: Buffer;
};

type ReportContent = {
  title: string;
  filenameSlug: string;
  rows: Record<string, unknown>[];
  filters: Record<string, string>;
  summary: Record<string, string | number>;
};

const BRAND_COLORS = {
  black: '#000000',
  sakura: '#F6DEEB',
  white: '#FFFFFF',
  cielo: '#B5E9FF',
  bloom: '#DA79A9',
  bruma: '#D8D8D8',
  camelia: '#FCADDB',
};

const LOGO_PATHS = [
  join(process.cwd(), 'src', 'reports', 'assets', 'logo-koara.png'),
  join(__dirname, 'assets', 'logo-koara.png'),
];

const FIELD_LABELS: Record<string, string> = {
  category: 'Categoría',
  clientId: 'ID del cliente',
  clientName: 'Cliente',
  createdAt: 'Fecha',
  customerId: 'ID del cliente',
  customerName: 'Cliente',
  customers: 'Clientes',
  email: 'Correo',
  endDate: 'Fecha final',
  invoiceCount: 'Cantidad de facturas',
  invoiceId: 'ID de factura',
  invoiceNumber: 'Número de factura',
  invoiceTotal: 'Total de factura',
  invoices: 'Facturas',
  items: 'Artículos',
  lastPurchase: 'Última compra',
  limit: 'Límite',
  message: 'Mensaje',
  period: 'Período',
  phone: 'Teléfono',
  productId: 'ID del producto',
  productName: 'Producto',
  products: 'Productos',
  purchaseCount: 'Compras',
  quantity: 'Cantidad',
  quantitySold: 'Cantidad vendida',
  revenue: 'Ingresos',
  startDate: 'Fecha inicial',
  subtotal: 'Subtotal',
  total: 'Total',
  totalAfterTax: 'Total después de impuesto',
  totalBeforeTax: 'Total antes de impuesto',
  totalInvoices: 'Facturas',
  totalSales: 'Total de ventas',
  totalSpent: 'Total gastado',
  uniqueClients: 'Clientes únicos',
  unitPrice: 'Precio unitario',
};

@Injectable()
export class ReportsExportService {
  constructor(private readonly reportsService: ReportsService) {}

  async exportReport(
    reportType: string,
    format: string,
    filters: ReportFilters,
  ): Promise<ExportPayload> {
    const normalizedFormat = this.validateFormat(format);
    const normalizedReportType = this.validateReportType(reportType);
    const reportContent = await this.getReportContent(
      normalizedReportType,
      filters,
    );

    const generatedAt = new Date();
    const extension = normalizedFormat === 'pdf' ? 'pdf' : 'csv';
    const filename = `${reportContent.filenameSlug}-${generatedAt
      .toISOString()
      .slice(0, 10)}.${extension}`;

    if (normalizedFormat === 'csv') {
      return {
        filename,
        contentType: 'text/csv; charset=utf-8',
        buffer: this.createCsv(reportContent),
      };
    }

    return {
      filename,
      contentType: 'application/pdf',
      buffer: await this.createPdf(reportContent, generatedAt),
    };
  }

  private validateFormat(format: string): ExportFormat {
    if (format === 'pdf' || format === 'csv') {
      return format;
    }

    throw new BadRequestException('El formato debe ser pdf o csv.');
  }

  private validateReportType(reportType: string): ReportType {
    const reportTypes: ReportType[] = [
      'sales',
      'top-products',
      'frequent-customers',
      'monthly-sales',
      'customer-history',
    ];

    if (reportTypes.includes(reportType as ReportType)) {
      return reportType as ReportType;
    }

    throw new BadRequestException('El tipo de reporte no es valido.');
  }

  private async getReportContent(
    reportType: ReportType,
    filters: ReportFilters,
  ): Promise<ReportContent> {
    if (reportType === 'customer-history') {
      return this.getCustomerHistoryContent(filters);
    }

    if (reportType === 'frequent-customers') {
      const limit = this.parseLimit(filters.limit);
      this.validateOptionalDateRange(filters);
      const data = await this.reportsService.getFrequentCustomers(limit, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      const rows = data.map((item) => ({
        customerId: item.client?.id ?? '',
        customerName: item.client?.name ?? '',
        purchaseCount: item.invoice_count,
        totalSpent: item.total_spent,
        lastPurchase: this.formatDate(item.last_purchase),
      }));

      return {
        title: 'Clientes frecuentes',
        filenameSlug: 'clientes-frecuentes',
        rows,
        filters: { ...this.optionalDateFilters(filters), limit: String(limit) },
        summary: {
          customers: rows.length,
          totalSpent: this.sumRows(rows, 'totalSpent'),
        },
      };
    }

    this.validateDateRange(filters);

    if (reportType === 'sales') {
      const data = await this.reportsService.getSalesList(
        filters.startDate!,
        filters.endDate!,
        filters.clientId,
      );
      const rows = data.map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        total: this.toNumber(invoice.total),
        createdAt: this.formatDate(invoice.created_at),
      }));

      return {
        title: 'Ventas',
        filenameSlug: 'ventas',
        rows,
        filters: this.dateFilters(filters, filters.clientId),
        summary: {
          invoiceCount: rows.length,
          totalSales: this.sumRows(rows, 'total'),
        },
      };
    }

    if (reportType === 'top-products') {
      const limit = this.parseLimit(filters.limit);
      const data = await this.reportsService.getTopSellingProducts(limit, {
        startDate: filters.startDate!,
        endDate: filters.endDate!,
      });
      const rows = data.map((item) => ({
        productId: item.product?.id ?? '',
        productName: item.product?.name ?? '',
        category: item.product?.category?.name ?? '',
        quantitySold: item.total_quantity_sold,
        revenue: item.revenue,
      }));

      return {
        title: 'Productos más vendidos',
        filenameSlug: 'productos-mas-vendidos',
        rows,
        filters: { ...this.dateFilters(filters), limit: String(limit) },
        summary: {
          products: rows.length,
          quantitySold: this.sumRows(rows, 'quantitySold'),
          revenue: this.sumRows(rows, 'revenue'),
        },
      };
    }

    const overview = await this.reportsService.getSalesOverview(
      filters.startDate!,
      filters.endDate!,
    );
    const rows = [
      {
        totalInvoices: overview.total_invoices,
        totalBeforeTax: overview.total_before_tax,
        totalAfterTax: overview.total_after_tax,
        uniqueClients: overview.unique_clients,
      },
    ];

    return {
      title: 'Resumen mensual de ventas',
      filenameSlug: 'resumen-mensual-ventas',
      rows,
      filters: this.dateFilters(filters),
      summary: rows[0],
    };
  }

  private async getCustomerHistoryContent(
    filters: ReportFilters,
  ): Promise<ReportContent> {
    if (!filters.customerId) {
      throw new BadRequestException('El customerId es obligatorio.');
    }

    const data = await this.reportsService.getCustomerPurchaseHistory(
      filters.customerId,
    );
    const rows = data.invoices.flatMap((invoice) =>
      invoice.invoice_items.map((item) => ({
        customerId: data.client.id,
        customerName: data.client.name,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        createdAt: this.formatDate(invoice.created_at),
        productId: item.product_id ?? '',
        productName: item.product?.name ?? '',
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unit_price),
        subtotal: this.toNumber(item.item_subtotal),
        invoiceTotal: this.toNumber(invoice.total),
      })),
    );

    return {
      title: `Historial de compras - ${data.client.name}`,
      filenameSlug: 'historial-compras',
      rows,
      filters: { customerId: filters.customerId },
      summary: {
        invoices: data.invoices.length,
        items: rows.length,
        totalSpent: data.invoices.reduce(
          (sum, invoice) => sum + this.toNumber(invoice.total),
          0,
        ),
      },
    };
  }

  private validateDateRange(filters: ReportFilters) {
    if (!filters.startDate || !filters.endDate) {
      throw new BadRequestException('startDate y endDate son obligatorios.');
    }
  }

  private validateOptionalDateRange(filters: ReportFilters) {
    if (
      (filters.startDate && !filters.endDate) ||
      (!filters.startDate && filters.endDate)
    ) {
      throw new BadRequestException(
        'startDate y endDate deben enviarse juntos.',
      );
    }
  }

  private parseLimit(limit?: string) {
    const value = limit ? Number(limit) : 10;

    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException('El limite debe ser un numero positivo.');
    }

    return value;
  }

  private dateFilters(filters: ReportFilters, clientId?: string) {
    return {
      startDate: filters.startDate!,
      endDate: filters.endDate!,
      ...(clientId ? { clientId } : {}),
    };
  }

  private optionalDateFilters(filters: ReportFilters) {
    if (filters.startDate && filters.endDate) {
      return this.dateFilters(filters);
    }

    return { period: 'Global' };
  }

  private createCsv(reportContent: ReportContent) {
    const rows =
      reportContent.rows.length > 0
        ? reportContent.rows
        : [{ message: 'No hay datos para los filtros seleccionados.' }];
    const headers = this.getHeaders(rows);
    const lines = [
      headers.map((header) => this.escapeCsv(this.humanize(header))).join(','),
      ...rows.map((row) =>
        headers.map((header) => this.escapeCsv(row[header])).join(','),
      ),
    ];

    return Buffer.from(lines.join('\n'), 'utf8');
  }

  private async createPdf(
    reportContent: ReportContent,
    generatedAt: Date,
  ): Promise<Buffer> {
    const document = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));

    const finished = new Promise<Buffer>((resolve) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.drawBrandBackground(document);
    this.writeHeader(document, reportContent, generatedAt);
    this.writeSummaryCards(document, reportContent);
    this.writeRows(document, reportContent.rows);
    this.writeFooter(document);

    document.end();

    return finished;
  }

  private writeRows(
    document: PDFKit.PDFDocument,
    rows: Record<string, unknown>[],
  ) {
    this.ensureSpace(document, 120);

    document
      .fillColor(BRAND_COLORS.black)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text('Detalle del reporte', 40, document.y);
    document
      .moveTo(40, document.y + 5)
      .lineTo(555, document.y + 5)
      .strokeColor(BRAND_COLORS.sakura)
      .lineWidth(1.5)
      .stroke();
    document.moveDown(1.25);

    if (rows.length === 0) {
      document
        .roundedRect(40, document.y, 515, 54, 12)
        .fillColor(BRAND_COLORS.sakura)
        .fill()
        .fillColor(BRAND_COLORS.black)
        .fontSize(10)
        .font('Helvetica')
        .text(
          'No hay datos para los filtros seleccionados.',
          58,
          document.y + 20,
        );
      return;
    }

    rows.forEach((row, index) => this.drawRecordCard(document, row, index));
  }

  private drawBrandBackground(document: PDFKit.PDFDocument) {
    document.rect(0, 0, 595.28, 841.89).fill(BRAND_COLORS.white);
    document.circle(500, 84, 86).fillOpacity(0.55).fill(BRAND_COLORS.sakura);
    document.circle(72, 740, 52).fillOpacity(0.35).fill(BRAND_COLORS.cielo);
    document.fillOpacity(1);
    document
      .moveTo(0, 138)
      .lineTo(595.28, 138)
      .strokeColor(BRAND_COLORS.sakura)
      .lineWidth(24)
      .stroke();
    document
      .moveTo(0, 151)
      .lineTo(595.28, 151)
      .strokeColor(BRAND_COLORS.cielo)
      .lineWidth(2)
      .stroke();
  }

  private writeHeader(
    document: PDFKit.PDFDocument,
    reportContent: ReportContent,
    generatedAt: Date,
  ) {
    const logoPath = LOGO_PATHS.find((path) => existsSync(path));

    if (logoPath) {
      document.image(logoPath, 40, 34, { width: 150 });
    } else {
      document
        .font('Times-Roman')
        .fontSize(28)
        .fillColor(BRAND_COLORS.black)
        .text('KOARA', 40, 44);
    }

    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(BRAND_COLORS.bloom)
      .text('REPORTE ADMINISTRATIVO', 368, 42, {
        width: 180,
        align: 'right',
        characterSpacing: 0.7,
      });
    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor(BRAND_COLORS.black)
      .text(`Generado: ${this.formatFriendlyDate(generatedAt)}`, 348, 62, {
        width: 200,
        align: 'right',
      });

    document
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor(BRAND_COLORS.black)
      .text(reportContent.title, 40, 178, { width: 350 });
    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#464646')
      .text('Lo mejor para tu piel, en cada paso', 42, 208, {
        width: 300,
      });

    document.y = 248;
  }

  private writeSummaryCards(
    document: PDFKit.PDFDocument,
    reportContent: ReportContent,
  ) {
    const filters = Object.entries(reportContent.filters);
    const summary = Object.entries(reportContent.summary);
    const cardY = document.y;
    const cardWidth = 245;
    const cardHeight = Math.max(
      this.getInfoCardHeight(filters),
      this.getInfoCardHeight(summary),
    );

    this.drawInfoCard(
      document,
      40,
      cardY,
      cardWidth,
      cardHeight,
      'Filtros',
      filters,
    );
    this.drawInfoCard(
      document,
      310,
      cardY,
      cardWidth,
      cardHeight,
      'Cálculos',
      summary,
    );

    document.y = cardY + cardHeight + 22;
  }

  private drawInfoCard(
    document: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    entries: [string, string | number][],
  ) {
    document
      .roundedRect(x, y, width, height, 14)
      .fillColor(BRAND_COLORS.sakura)
      .fill();
    document
      .roundedRect(x + 7, y + 7, width - 14, height - 14, 10)
      .fillColor(BRAND_COLORS.white)
      .fill();
    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(BRAND_COLORS.bloom)
      .text(title.toUpperCase(), x + 18, y + 17, {
        width: width - 36,
        characterSpacing: 0.4,
      });

    entries.forEach(([key, value], index) => {
      document
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(BRAND_COLORS.black)
        .text(
          `${this.humanize(key)}: ${this.formatValue(value)}`,
          x + 18,
          y + 38 + index * 13,
          { width: width - 36 },
        );
    });
  }

  private getInfoCardHeight(entries: [string, string | number][]) {
    return Math.max(86, 46 + entries.length * 14);
  }

  private drawRecordCard(
    document: PDFKit.PDFDocument,
    row: Record<string, unknown>,
    index: number,
  ) {
    const entries = Object.entries(row);
    const cardX = 40;
    const cardWidth = 515;
    const innerX = cardX + 18;
    const columnWidth = 230;
    const gap = 24;
    const rowHeights: number[] = [];

    for (let i = 0; i < entries.length; i += 2) {
      const left = this.getEntryHeight(entries[i][0], entries[i][1]);
      const right = entries[i + 1]
        ? this.getEntryHeight(entries[i + 1][0], entries[i + 1][1])
        : 0;
      rowHeights.push(Math.max(left, right));
    }

    const cardHeight =
      48 + rowHeights.reduce((total, height) => total + height, 0);

    this.ensureSpace(document, cardHeight + 14);
    const y = document.y;

    document
      .roundedRect(cardX, y, cardWidth, cardHeight, 10)
      .fillColor(index % 2 === 0 ? BRAND_COLORS.white : '#FFF7FB')
      .fill();
    document
      .roundedRect(cardX, y, cardWidth, cardHeight, 10)
      .strokeColor(BRAND_COLORS.sakura)
      .lineWidth(1)
      .stroke();

    document
      .fillColor(BRAND_COLORS.bloom)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`Registro ${index + 1}`, innerX, y + 14, {
        width: cardWidth - 36,
      });

    let currentY = y + 34;
    entries.forEach(([key, value], entryIndex) => {
      const column = entryIndex % 2;
      const x = innerX + column * (columnWidth + gap);

      document
        .fillColor(BRAND_COLORS.black)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(this.humanize(key).toUpperCase(), x, currentY, {
          width: columnWidth,
        });
      document
        .fillColor('#3D3D3D')
        .font('Helvetica')
        .fontSize(8.5)
        .text(this.formatValue(value), x, currentY + 11, {
          width: columnWidth,
          lineGap: 1,
        });

      if (column === 1 || entryIndex === entries.length - 1) {
        currentY += rowHeights[Math.floor(entryIndex / 2)];
      }
    });

    document.y = y + cardHeight + 10;
  }

  private getEntryHeight(key: string, value: unknown) {
    const labelLength = this.humanize(key).length;
    const valueLength = this.formatValue(value).length;
    const labelLines = Math.max(1, Math.ceil(labelLength / 36));
    const valueLines = Math.max(1, Math.ceil(valueLength / 32));

    return 14 + labelLines * 8 + valueLines * 10;
  }

  private ensureSpace(document: PDFKit.PDFDocument, height: number) {
    if (document.y + height <= 770) {
      return;
    }

    this.writeFooter(document);
    document.addPage();
    this.drawBrandBackground(document);
    document.y = 64;
  }

  private writeFooter(document: PDFKit.PDFDocument) {
    document
      .moveTo(40, 770)
      .lineTo(555, 770)
      .strokeColor(BRAND_COLORS.bruma)
      .lineWidth(1)
      .stroke();
    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#666666')
      .text('KOARA - Reporte generado automáticamente', 40, 780, {
        width: 260,
      });
  }

  private getHeaders(rows: Record<string, unknown>[]) {
    return rows.length > 0 ? Object.keys(rows[0]) : ['message'];
  }

  private escapeCsv(value: unknown) {
    const text = this.formatValue(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private formatRow(row: Record<string, unknown>) {
    return Object.entries(row)
      .map(
        ([key, value]) => `${this.humanize(key)}: ${this.formatValue(value)}`,
      )
      .join(' | ');
  }

  private humanize(value: string) {
    return (
      FIELD_LABELS[value] ??
      value
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (letter) => letter.toUpperCase())
    );
  }

  private truncate(value: string, maxLength: number) {
    return value.length > maxLength
      ? `${value.slice(0, Math.max(0, maxLength - 3))}...`
      : value;
  }

  private formatValue(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }

    return '';
  }

  private formatDate(value: Date | string | null) {
    if (!value) {
      return '';
    }

    return this.formatFriendlyDate(value);
  }

  private formatFriendlyDate(value: Date | string | null) {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('es-HN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private toNumber(value: unknown) {
    if (!value) {
      return 0;
    }

    if (typeof value === 'object' && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value);
  }

  private sumRows(rows: Record<string, unknown>[], key: string) {
    return rows.reduce((sum, row) => sum + this.toNumber(row[key]), 0);
  }
}
