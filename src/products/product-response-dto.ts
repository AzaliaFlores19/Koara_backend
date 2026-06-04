import { Prisma } from '@prisma/client';

export class ProductCategoryResponseDto {
  id!: string;
  name!: string;
}

export class ProductResponseDto {
  id!: string;
  name!: string;
  code_bar!: string;
  description!: string | null;
  stock!: number;
  min_stock!: number;
  price!: Prisma.Decimal;
  image!: string | null;
  category!: ProductCategoryResponseDto | null;
}
