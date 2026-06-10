import { Expose } from 'class-transformer';

export class ExpensesIncomeComparisonResponseDto {
  @Expose()
  month: string;

  @Expose()
  totalExpenses: number;

  @Expose()
  totalRevenues: number;
}
