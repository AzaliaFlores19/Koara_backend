import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsNotEmpty({ message: 'El nombre del cliente no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  name!: string;

  @ApiProperty({ example: '08011999123456', required: false })
  @IsOptional()
  @IsString({ message: 'El RTN debe ser texto.' })
  @Matches(/^\d{14}$/, {
    message: 'El RTN debe tener exactamente 14 dígitos numéricos.',
  })
  rtn?: string;

  @ApiProperty({ example: '+50499123456', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto.' })
  phone?: string;

  @ApiProperty({ example: 'juan@gmail.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email?: string;
}
