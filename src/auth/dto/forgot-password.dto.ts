import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El email no es valido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;
}
