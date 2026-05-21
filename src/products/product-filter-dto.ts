import { IsOptional, IsString } from 'class-validator';

export class ProductFilterDto {
  @IsOptional()
  @IsString({ message: 'La página debe recibirse como texto numérico.' })
  page?: string;

  @IsOptional()
  @IsString({ message: 'El límite debe recibirse como texto numérico.' })
  limit?: string;

  @IsOptional()
  @IsString({ message: 'El ID de la categoría debe ser texto.' })
  category_id?: string;
}
