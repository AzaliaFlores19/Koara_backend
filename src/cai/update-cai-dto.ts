import { IsOptional, IsString, Length, Matches, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCaiDto {
  @ApiProperty({ description: 'Código CAI', example: '4E5F67-A1B2C4-D4E5F6-7G8H9I-TKL012-LJ' })
  @IsOptional()
  @IsString({ message: 'El código CAI debe ser un texto.' })
  @Length(37, 37, { message: 'El código CAI debe tener exactamente 37 caracteres (incluyendo los guiones).' })
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El CAI solo puede contener letras mayúsculas, números y guiones.',
  })
  cai_code?: string;

  @ApiProperty({ description: 'Estado activo', example: true })
  @IsOptional()
  @IsBoolean({ message: 'El estado is_active debe ser verdadero o falso.' })
  is_active?: boolean;
}