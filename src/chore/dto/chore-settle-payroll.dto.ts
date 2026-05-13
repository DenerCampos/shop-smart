import { IsInt, Max, Min } from 'class-validator';

export class ChoreSettlePayrollDto {
  @IsInt()
  @Min(200001)
  @Max(999912)
  periodYm: number;
}
