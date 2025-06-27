import { Expose } from 'class-transformer';

export class ExpensesIncomeComparisonResponseDto {
  @Expose()
  month: Date;

  @Expose()
  totalExpenses: number;

  @Expose()
  totalRevenues: number;
}
