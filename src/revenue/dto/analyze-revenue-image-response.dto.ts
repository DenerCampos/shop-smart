import { Expose } from 'class-transformer';

export class AnalyzeRevenueImageResponseDto {
  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  date: Date;

  @Expose()
  confidence: number;

  @Expose()
  provider: string;
}
