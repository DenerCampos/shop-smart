import { Expose } from 'class-transformer';
import { CouponReaderResponseDto } from 'src/coupon-reader/dto/coupon-reader-response.dto';

export class AnalyzeImageRecognitionResponseDto extends CouponReaderResponseDto {
  @Expose()
  provider: string;

  @Expose()
  confidence: number;

  @Expose()
  status: string;

  @Expose()
  error?: string;
}
