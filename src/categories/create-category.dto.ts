import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'El nombre de la categoría no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  name!: string;
}
