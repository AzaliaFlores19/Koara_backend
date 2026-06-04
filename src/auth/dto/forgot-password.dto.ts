import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario para recuperar la contraseña',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'El email no es valido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;
}
