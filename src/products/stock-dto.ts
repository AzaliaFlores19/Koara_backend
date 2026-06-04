import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StockDto {
  @ApiProperty({ example: 5 })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor o igual a 1.' })
  quantity!: number;
}
