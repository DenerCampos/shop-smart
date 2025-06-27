import { Expose } from 'class-transformer';

export class ExpenseByGroupResponseDto {
  @Expose()
  name: string;

  @Expose()
  value: number;
}
