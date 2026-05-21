export class InvoiceItemResponseDto {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  customerId: string;
  cashierId: string;
  items: InvoiceItemResponseDto[];
  subtotal: number;
  taxes: number;
  total: number;
  status: string;
  issuedAt: Date;
}
