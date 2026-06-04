import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre unico de la categoria',
    example: 'Cuidado facial',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El nombre de la categoria no puede estar vacio.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres.' })
  name!: string;
}
