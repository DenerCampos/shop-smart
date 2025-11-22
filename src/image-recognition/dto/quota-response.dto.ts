import { Expose } from 'class-transformer';

export class QuotaResponseDto {
  @Expose()
  provider: string;

  @Expose()
  requestCount: number;

  @Expose()
  dailyLimit: number;

  @Expose()
  remaining: number;
}
