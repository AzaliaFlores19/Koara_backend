import { IsInt, Min } from 'class-validator';

export class StockThresholdDto {
  @IsInt({ message: 'El stock minimo debe ser un numero entero.' })
  @Min(0, { message: 'El stock minimo no puede ser negativo.' })
  min_stock!: number;
}
