import { IsNotEmpty, IsUUID, IsString, IsInt, Min, IsDate, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCaiRangeDto {
  @IsNotEmpty({ message: 'El cai_id es obligatorio.' })
  @IsUUID('all', { message: 'El cai_id debe ser un UUID válido.' })
  cai_id!: string;

  @IsNotEmpty({ message: 'El código base es obligatorio.' })
  @IsString({ message: 'El código base debe ser un texto.' })
  @Matches(/^\d{3}-\d{3}-\d{2}$/, {
    message: 'El código base debe tener el formato oficial (ejemplo: 000-001-01).',
  })
  base_code!: string; 

  @IsNotEmpty({ message: 'El rango inicial es obligatorio.' })
  @IsInt({ message: 'El rango inicial debe ser un número entero.' })
  @Min(1, { message: 'El rango inicial debe ser mayor a 0.' })
  range_start!: number;

  @IsNotEmpty({ message: 'El rango final es obligatorio.' })
  @IsInt({ message: 'El rango final debe ser un número entero.' })
  @Min(1, { message: 'El rango final debe ser mayor a 0.' })
  range_end!: number;

  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria.' })
  @Type(() => Date)
  @IsDate({ message: 'Debe ser una fecha válida.' })
  expiration_date!: Date;
}