import { IsInt, Min } from 'class-validator';

export class StockDto {
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor o igual a 1.' })
  quantity!: number;
}
