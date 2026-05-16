import { IsOptional, IsString, Length, Matches, IsBoolean } from 'class-validator';

export class UpdateCaiDto {
  @IsOptional()
  @IsString({ message: 'El código CAI debe ser un texto.' })
  @Length(37, 37, { message: 'El código CAI debe tener exactamente 37 caracteres (incluyendo los guiones).' })
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El CAI solo puede contener letras mayúsculas, números y guiones.',
  })
  cai_code?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado is_active debe ser verdadero o falso.' })
  is_active?: boolean;
}