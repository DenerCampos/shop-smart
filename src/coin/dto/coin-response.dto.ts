import { Exclude, Expose } from 'class-transformer';

export class CoinResponseDto {
  @Expose()
  id: string;

  @Expose()
  balance: number;

  @Expose()
  totalEarned: number;

  @Expose()
  totalSpent: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
