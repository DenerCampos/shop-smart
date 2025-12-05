import { Expose } from 'class-transformer';

export class AnalyzeRevenueAudioResponseDto {
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
