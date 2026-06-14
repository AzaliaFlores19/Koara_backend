import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger'; // <-- Para campos opcionales

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre completo a actualizar',
    example: 'Admin Coreano'
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Nuevo correo electrónico',
    example: 'contacto@koara.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico proporcionado no es válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '+50499999999'
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;
}