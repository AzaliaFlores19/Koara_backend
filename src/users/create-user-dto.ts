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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Admin Koara',
  })
  @IsString({
    message: 'El nombre debe ser texto',
  })
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  name!: string;

  @ApiProperty({
    description: 'Correo electronico unico del usuario',
    example: 'admin@koara.com',
  })
  @IsEmail(
    {},
    {
      message: 'El correo debe tener un formato valido',
    },
  )
  email!: string;

  @ApiPropertyOptional({
    description: 'Numero de telefono del usuario',
    example: '9999-9999',
  })
  @IsOptional()
  @IsString({
    message: 'El telefono debe ser texto',
  })
  phone?: string;

  @ApiProperty({
    description:
      'Contrasena del usuario. Debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero.',
    example: 'Admin123*',
    minLength: 8,
  })
  @IsString({
    message: 'La contrasena debe ser texto',
  })
  @MinLength(8, {
    message: 'La contrasena debe tener al menos 8 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contrasena debe tener al menos una letra mayuscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contrasena debe tener al menos una letra minuscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contrasena debe tener al menos un numero',
  })
  password!: string;

  @ApiProperty({
    description: 'Rol asignado al usuario',
    enum: roles,
    example: roles.ADMIN,
  })
  @IsEnum(roles, {
    message: 'El rol debe ser ADMIN o EMPLOYEE',
  })
  role!: roles;
}
