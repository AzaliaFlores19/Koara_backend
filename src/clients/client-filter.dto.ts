import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientFilterDto {
  @ApiProperty({ required: false, description: 'Número de página (default: 1)' })
  @IsOptional()
  @IsString({ message: 'La página debe recibirse como texto numérico.' })
  page?: string;

  @ApiProperty({ required: false, description: 'Resultados por página (default: 10)' })
  @IsOptional()
  @IsString({ message: 'El límite debe recibirse como texto numérico.' })
  limit?: string;

  @ApiProperty({ required: false, description: 'Buscar por nombre, correo o RTN' })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto.' })
  search?: string;
}
