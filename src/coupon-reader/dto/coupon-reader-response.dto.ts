import { Exclude, Expose, Type } from 'class-transformer';

// DTO para cada item individual
export class CouponItemDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  unit: string;

  @Expose()
  value: number;

  @Expose()
  total: number;

  @Expose()
  group: string;
}

// DTO principal de resposta
export class CouponReaderResponseDto {
  @Exclude()
  url: string;

  @Expose()
  uri: string;

  @Expose()
  name: string;

  @Expose()
  date: Date;

  @Expose()
  @Type(() => CouponItemDto)
  items: CouponItemDto[];
}
