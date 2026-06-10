import { Expose } from 'class-transformer';

export class ChorePendingCoinRewardDto {
  @Expose()
  totalCoins: number;
}
