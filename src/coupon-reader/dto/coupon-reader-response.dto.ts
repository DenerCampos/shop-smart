import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PaymentResponseDto } from 'src/payment/dto/payment-response.dto';
import { StoreResponseDto } from 'src/store/dto/store-response.dto';
import { CouponReaderItemResponseDto } from './coupon-reader-item-response.dto';

export class CouponReaderResponseDto {
  @Exclude()
  url: string;

  @Expose()
  uri: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => (value ? new Date(value) : null))
  date: Date;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  @Type(() => PaymentResponseDto)
  payment: PaymentResponseDto;

  @Expose()
  @Type(() => StoreResponseDto)
  store: StoreResponseDto;

  @Expose()
  @Type(() => CouponReaderItemResponseDto)
  items: CouponReaderItemResponseDto[];
}
