import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ChorePayrollSuggestionResponseDto {
  @Expose()
  suggestedPeriodYm: number;

  @Expose()
  suggestedCloseDate: string;

  @Expose()
  message: string;
}
