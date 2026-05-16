import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateCaiDto {
  @IsNotEmpty({ message: 'El código CAI no puede estar vacío.' })
  @IsString({ message: 'El código CAI debe ser un texto.' })
  @Length(37, 37, { message: 'El código CAI debe tener exactamente 37 caracteres (incluyendo los guiones).' })
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El CAI solo puede contener letras mayúsculas, números y guiones.',
  })
  cai_code!: string; 
}