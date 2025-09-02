import { Expose } from 'class-transformer';

export class BalanceCoinDto {
  @Expose()
  balance: number;
}
