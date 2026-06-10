import { Expose } from 'class-transformer';
import { TransactionType } from '../types/coinType';

export class CoinTransactionItemDto {
  @Expose()
  id: string;

  @Expose()
  amount: number;

  @Expose()
  transactionType: TransactionType;

  @Expose()
  description: string | null;

  @Expose()
  balanceBefore: number;

  @Expose()
  balanceAfter: number;

  @Expose()
  createdAt: Date;

  @Expose()
  userId: string;

  @Expose()
  userName: string;
}
