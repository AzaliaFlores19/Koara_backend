import { IsOptional, IsString, IsInt, Min, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCaiRangeDto {
  @IsOptional()
  @IsString()
  base_code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  range_start?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  range_end?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}