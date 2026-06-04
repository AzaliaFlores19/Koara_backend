import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateCaiDto {
  @ApiProperty({ description: 'Código CAI', example: '4E5F67-A1B2C4-D4E5F6-7G8H9I-TKL012-LJ' })
  @IsNotEmpty({ message: 'El código CAI no puede estar vacío.' })
  @IsString({ message: 'El código CAI debe ser un texto.' })
  @Length(37, 37, { message: 'El código CAI debe tener exactamente 37 caracteres (incluyendo los guiones).' })
  @Matches(/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{2}$/, {
    message: 'El formato del CAI es inválido. Debe seguir el patrón oficial de bloques separados por guiones (ejemplo: 4E5F67-A1B2C4-D4E5F6-7G8H9I-TKL012-LJ).',
  })
  cai_code!: string; 
}