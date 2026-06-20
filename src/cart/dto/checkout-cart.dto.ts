import { ApiProperty } from '@nestjs/swagger';
import { payment_method } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CheckoutCartDto {
  @ApiProperty({
    description: 'ID del cliente al que se emitira la factura',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({
    description: 'Metodo de pago',
    enum: payment_method,
    example: payment_method.CASH,
  })
  @IsEnum(payment_method)
  @IsNotEmpty()
  payment_method!: payment_method;

  @ApiProperty({
    description: 'Tasa de impuesto aplicada a la factura',
    example: 0.15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  taxRate?: number;
}
