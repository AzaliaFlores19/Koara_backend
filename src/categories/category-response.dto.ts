import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'ID de la categoria',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre de la categoria',
    example: 'Cuidado facial',
  })
  name!: string;

  @ApiProperty({
    description: 'Fecha de creacion de la categoria',
    example: '2026-06-04T12:00:00.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Estado activo de la categoria',
    example: true,
  })
  is_active!: boolean;
}
