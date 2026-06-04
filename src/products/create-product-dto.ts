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
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Crema hidratante facial' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  name!: string;

  @ApiProperty({ example: '7501234567890' })
  @IsString({ message: 'El código de barra debe ser texto.' })
  @IsNotEmpty({ message: 'El código de barra no puede estar vacío.' })
  code_bar!: string;

  @ApiProperty({ example: 'Crema para piel seca con vitamina E', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(200, {
    message: 'La descripción no puede superar los 200 caracteres.',
  })
  description?: string;

  @ApiProperty({ example: 'cm9x1abc2def3ghi4' })
  @IsString({ message: 'El ID de la categoría debe ser texto.' })
  @IsNotEmpty({ message: 'El ID de la categoría es obligatorio.' })
  category_id!: string;

  @ApiProperty({ example: 50 })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock!: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsInt({ message: 'El stock mínimo debe ser un número entero.' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo.' })
  min_stock?: number;

  @ApiProperty({ example: 299.99 })
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0.01, { message: 'El precio debe ser mayor o igual a 0.01.' })
  price!: number;

  @ApiProperty({ example: 'https://cdn.koara.com/productos/crema.jpg', required: false })
  @IsOptional()
  @IsString({ message: 'La imagen debe ser texto.' })
  image?: string;
}
