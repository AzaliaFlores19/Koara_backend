import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserFilterDto {
  @ApiProperty({ required: false, description: 'Buscar por nombre o correo' })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto.' })
  search?: string;
}
