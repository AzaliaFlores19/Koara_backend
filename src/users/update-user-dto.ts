import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { roles } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(roles)
  role?: roles;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}