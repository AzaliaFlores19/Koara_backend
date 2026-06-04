import { IsNotEmpty, IsUUID, IsString, IsInt, Min, IsDate, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCaiRangeDto {
  @ApiProperty({ description: 'ID único (UUID) del CAI maestro asociado', example: 'd3b07384-d113-49cd-a5d6-8ee000123456' })
  @IsNotEmpty({ message: 'El cai_id es obligatorio.' })
  @IsUUID('all', { message: 'El cai_id debe ser un UUID válido.' })
  cai_id!: string;

  @ApiProperty({ description: 'Código del establecimiento, punto de emisión y tipo', example: '000-001-01' })
  @IsNotEmpty({ message: 'El código base es obligatorio.' })
  @IsString({ message: 'El código base debe ser un texto.' })
  @Matches(/^\d{3}-\d{3}-\d{2}$/, {
    message: 'El código base debe tener el formato oficial (ejemplo: 000-001-01).',
  })
  base_code!: string; 

  @ApiProperty({ description: 'Número inicial del rango otorgado por la SAR', example: 1, minimum: 1 })
  @IsNotEmpty({ message: 'El rango inicial es obligatorio.' })
  @IsInt({ message: 'El rango inicial debe ser un número entero.' })
  @Min(1, { message: 'El rango inicial debe ser mayor a 0.' })
  range_start!: number;

  @ApiProperty({ description: 'Número límite final del rango otorgado por la SAR', example: 5000, minimum: 1 })
  @IsNotEmpty({ message: 'El rango final es obligatorio.' })
  @IsInt({ message: 'El rango final debe ser un número entero.' })
  @Min(1, { message: 'El rango final debe ser mayor a 0.' })
  range_end!: number;

  @ApiProperty({ description: 'Fecha límite de emisión / expiración del rango', example: '2027-12-31T23:59:59.000Z' })
  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria.' })
  @Type(() => Date)
  @IsDate({ message: 'Debe ser una fecha válida.' })
  expiration_date!: Date;
}