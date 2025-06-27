import { Expose } from 'class-transformer';

export class ExpenseByDateResponseDto {
  @Expose()
  value: number;

  @Expose()
  date: Date;
}
