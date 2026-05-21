import { Prisma } from '@prisma/client';

export class ProductCategoryResponseDto {
  id!: string;
  name!: string;
  is_active!: boolean;
}

export class ProductResponseDto {
  id!: string;
  name!: string;
  code_bar!: string;
  description!: string | null;
  category_id!: string | null;
  stock!: number;
  min_stock!: number;
  price!: Prisma.Decimal;
  image!: string | null;
  created_at!: Date;
  is_active!: boolean;
  category!: ProductCategoryResponseDto | null;
}
