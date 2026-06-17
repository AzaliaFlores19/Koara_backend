import { roles } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Admin Koara',
  })
  name!: string;

  @ApiProperty({
    description: 'Correo electronico del usuario',
    example: 'admin@koara.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Numero de telefono del usuario',
    example: '9999-9999',
    nullable: true,
  })
  phone!: string | null;

  @ApiProperty({
    description: 'Rol asignado al usuario',
    enum: roles,
    example: roles.ADMIN,
  })
  role!: roles;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
  })
  is_active!: boolean;
}
