import { IsUUID, IsArray, ValidateNested, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { payment_method } from '@prisma/client';

export class CreateInvoiceItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsEnum(payment_method)
  @IsNotEmpty()
  payment_method: payment_method;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
