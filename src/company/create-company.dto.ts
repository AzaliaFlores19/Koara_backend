import { IsNotEmpty, IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido.' })
  @IsString({ message: 'El nombre de la empresa debe ser una cadena de texto.' })
  name!: string;

  @IsNotEmpty({ message: 'El RTN es requerido.' })
  @Matches(/^\d{14}$/, {
    message: 'El RTN debe contener exactamente 14 dígitos numéricos.',
  })
  rtn!: string;

  @IsOptional()
  @IsString()
  address?: string; 

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  email?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}