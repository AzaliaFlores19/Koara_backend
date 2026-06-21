import { IsNotEmpty, IsString, Length, Matches, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCaiWithRangeDto {
  @ApiProperty({ description: 'Código CAI autorizado por la SAR', example: '4E5F67-A1B2C4-D4E5F6-7G8H9I-TKL012-LJ' })
  @IsNotEmpty({ message: 'El código CAI no puede estar vacío.' })
  @IsString({ message: 'El código CAI debe ser un texto.' })
  @Length(37, 37, { message: 'El código CAI debe tener exactamente 37 caracteres (incluyendo los guiones).' })
  @Matches(/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{2}$/, {
    message: 'El formato del CAI es inválido. Debe seguir el patrón oficial de bloques separados por guiones (ejemplo: 4E5F67-A1B2C4-D4E5F6-7G8H9I-TKL012-LJ).',
  })
  cai_code!: string;

  @ApiProperty({ description: 'Número inicial del rango autorizado', example: 1 })
  @IsNotEmpty({ message: 'El rango inicial no puede estar vacío.' })
  @IsInt({ message: 'El rango inicial debe ser un número entero.' })
  @Min(1, { message: 'El rango inicial debe ser mayor o igual a 1.' })
  range_start!: number;

  @ApiProperty({ description: 'Número final del rango autorizado', example: 500 })
  @IsNotEmpty({ message: 'El rango final no puede estar vacío.' })
  @IsInt({ message: 'El rango final debe ser un número entero.' })
  @Min(1, { message: 'El rango final debe ser mayor o igual a 1.' })
  range_end!: number;

  @ApiProperty({ description: 'Fecha límite de emisión establecida por la SAR', example: '2027-06-30' })
  @IsNotEmpty({ message: 'La fecha de expiración no puede estar vacía.' })
  @IsDateString({}, { message: 'La fecha de expiración debe tener un formato de fecha válido (AAAA-MM-DD).' })
  expiration_date!: string;
}