export class InvoiceItemResponseDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  userId: string;
  cashierId: string;
  items: InvoiceItemResponseDto[];
  subtotal: number;
  taxes: number;
  total: number;
  issuedAt: Date;
}
