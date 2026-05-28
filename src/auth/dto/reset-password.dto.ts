import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contrasena es obligatoria' })
  @MinLength(8, {
    message: 'La nueva contrasena debe tener al menos 8 caracteres',
  })
  password!: string;
}
