import { IsOptional, IsString, IsEmail, Matches } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^\d{14}$/, {
    message: 'El RTN debe contener exactamente 14 dígitos numéricos.',
  })
  rtn?: string;

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