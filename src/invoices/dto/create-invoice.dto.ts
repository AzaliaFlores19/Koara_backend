import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { payment_method } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'prod123',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: 'cust123',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'ID del usuario que crea la factura',
    example: 'user123',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'CREDIT_CARD',
  })
  @IsEnum(payment_method)
  @IsNotEmpty()
  payment_method: payment_method;

  @ApiProperty({
    description: 'Tasa de impuesto aplicada a la factura',
    example: 0.15,
  })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({
    description: 'Lista de items de la factura',
    type: [CreateInvoiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
