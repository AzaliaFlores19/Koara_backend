import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { roles } from '@prisma/client';

export class CreateUserDto {
  @IsString({
    message: 'El nombre debe ser texto',
  })
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  name!: string;

  @IsEmail({}, {
    message: 'El correo debe tener un formato válido',
  })
  email!: string;

  @IsOptional()
  @IsString({
    message: 'El teléfono debe ser texto',
  })
  phone?: string;

  @IsString({
    message: 'La contraseña debe ser texto',
  })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe tener al menos una letra mayúscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe tener al menos una letra minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe tener al menos un número',
  })
  password!: string;

  @IsEnum(roles, {
    message: 'El rol debe ser ADMIN o EMPLOYEE',
  })
  role!: roles;
}