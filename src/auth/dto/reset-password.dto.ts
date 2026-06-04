import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token para restablecer la contraseña',
    example: 'token123',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token!: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'newpassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contrasena es obligatoria' })
  @MinLength(8, {
    message: 'La nueva contrasena debe tener al menos 8 caracteres',
  })
  password!: string;
}
