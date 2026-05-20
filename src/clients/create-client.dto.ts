import { IsNotEmpty, IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty({ message: 'El nombre del cliente no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'El RTN debe ser texto.' })
  @Matches(/^\d{14}$/, { message: 'El RTN debe tener exactamente 14 dígitos numéricos.' })
  rtn?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto.' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email?: string;
}
