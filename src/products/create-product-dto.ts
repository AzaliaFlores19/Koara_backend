import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  name!: string;

  @IsString({ message: 'El código de barra debe ser texto.' })
  @IsNotEmpty({ message: 'El código de barra no puede estar vacío.' })
  code_bar!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(200, {
    message: 'La descripción no puede superar los 200 caracteres.',
  })
  description?: string;

  @IsString({ message: 'El ID de la categoría debe ser texto.' })
  @IsNotEmpty({ message: 'El ID de la categoría es obligatorio.' })
  category_id!: string;

  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock!: number;

  @IsOptional()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsInt({ message: 'El stock mínimo debe ser un número entero.' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo.' })
  min_stock?: number;

  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0.01, { message: 'El precio debe ser mayor o igual a 0.01.' })
  price!: number;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser texto.' })
  image?: string;
}
