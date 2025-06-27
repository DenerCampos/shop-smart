import { Expose } from 'class-transformer';

export class ExpenseByStoreResponseDto {
  @Expose()
  name: string;

  @Expose()
  value: number;
}
