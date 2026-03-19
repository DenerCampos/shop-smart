import { Expose, Type } from 'class-transformer';

class ExpenseDataDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  date: Date;
}

class RevenueDataDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  date: Date;
}

export class FamilyGroupMemberDataResponseDto {
  @Expose()
  userId: string;

  @Expose()
  name: string;

  @Expose()
  profileImage: string | null;

  @Expose()
  totalExpenses: number;

  @Expose()
  totalRevenues: number;

  @Expose()
  @Type(() => ExpenseDataDto)
  expenses: ExpenseDataDto[];

  @Expose()
  @Type(() => RevenueDataDto)
  revenues: RevenueDataDto[];
}
