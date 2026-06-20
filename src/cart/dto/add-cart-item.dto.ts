import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID del producto que se agregara al carrito',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Cantidad a agregar al carrito',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un numero entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor o igual a 1.' })
  quantity!: number;
}
