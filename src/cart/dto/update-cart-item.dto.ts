import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Nueva cantidad del producto en el carrito',
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un numero entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor o igual a 1.' })
  quantity!: number;
}
