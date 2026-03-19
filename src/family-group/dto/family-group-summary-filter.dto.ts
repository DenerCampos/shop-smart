import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class FamilyGroupSummaryFilterDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => Number(value))
  month: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  @Transform(({ value }) => Number(value))
  year: number;
}
