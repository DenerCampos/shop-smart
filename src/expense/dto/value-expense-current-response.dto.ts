import { Expose } from 'class-transformer';

export class ValueExpenseCurrentResponseDto {
  @Expose()
  value: number;
}
