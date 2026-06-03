import { IsNotEmpty, IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Empresa S.A.',
  })
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido.' })
  @IsString({ message: 'El nombre de la empresa debe ser una cadena de texto.' })
  name!: string;

  @ApiProperty({
    description: 'RTN de la empresa',
    example: '12345678901234',
  })
  @IsNotEmpty({ message: 'El RTN es requerido.' })
  @Matches(/^\d{14}$/, {
    message: 'El RTN debe contener exactamente 14 dígitos numéricos.',
  })
  rtn!: string;

  @ApiProperty({
    description: 'Dirección de la empresa',
    example: 'Calle Principal 123',
  })
  @IsOptional()
  @IsString()
  address?: string; 

  @ApiProperty({
    description: 'Número de teléfono de la empresa',
    example: '9887-3322',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Correo electrónico de la empresa',
    example: 'info@empresas.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  email?: string;

  @ApiProperty({
    description: 'Logo de la empresa',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;
}