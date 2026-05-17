import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { roles } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  password!: string;

  @IsEnum(roles)
  role!: roles;
}