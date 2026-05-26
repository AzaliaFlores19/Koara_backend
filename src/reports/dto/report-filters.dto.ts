import { IsDateString } from 'class-validator';

export class ReportFiltersDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
