import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { roles } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(roles, { message: 'El rol debe ser ADMIN o EMPLOYEE' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: roles;
}
