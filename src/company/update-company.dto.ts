import { IsOptional, IsString, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'RTN de la empresa',
    example: '12345678901234',
  })
  @IsOptional()
  @Matches(/^\d{14}$/, {
    message: 'El RTN debe contener exactamente 14 dígitos numéricos.',
  })
  rtn?: string;

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