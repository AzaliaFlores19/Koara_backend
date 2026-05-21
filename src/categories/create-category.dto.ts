import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'El nombre de la categoría no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres.' })
  name!: string;
}
