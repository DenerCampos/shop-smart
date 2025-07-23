import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class ProfileResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  income: number;

  @Expose()
  expenses: number;

  @Expose()
  coins: number;

  @Expose()
  isFirstAccess: boolean;

  @Expose()
  hasRecurringRevenues: boolean;

  @Expose()
  hasRecurringExpenses: boolean;
}
