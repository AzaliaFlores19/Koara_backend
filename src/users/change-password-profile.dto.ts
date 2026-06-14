import { IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // <-- Importante

export class ChangePasswordDto {
  @ApiProperty({
    description: 'La contraseña actual del usuario',
    example: 'MiPassword123'
  })
  @IsString({ message: 'La contraseña actual debe ser un texto válido' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria y no puede estar vacía' })
  currentPassword!: string;

  @ApiProperty({
    description: 'La nueva contraseña de seguridad',
    example: 'NuevaClave2026',
    minLength: 8,
    maxLength: 100
  })
  @IsString({ message: 'La nueva contraseña debe ser un texto válido' })
  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía' })
  @MinLength(8, { message: 'La nueva contraseña debe tener un mínimo de 8 caracteres' })
  @MaxLength(100, { message: 'La nueva contraseña es demasiado larga' })
  newPassword!: string;
}