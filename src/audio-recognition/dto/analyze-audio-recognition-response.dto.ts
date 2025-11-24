import { Expose, Type } from 'class-transformer';

class ItemGroupDto {
  @Expose()
  name: string;
}

class ItemDto {
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
  @Type(() => ItemGroupDto)
  group: ItemGroupDto;
}

class StoreDto {
  @Expose()
  name: string;
}

class PaymentDto {
  @Expose()
  name: string;
}

export class AnalyzeAudioRecognitionResponseDto {
  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  @Type(() => ItemDto)
  items: ItemDto[];

  @Expose()
  @Type(() => StoreDto)
  store: StoreDto;

  @Expose()
  @Type(() => PaymentDto)
  payment: PaymentDto;

  @Expose()
  date: Date;

  @Expose()
  confidence: number;

  @Expose()
  provider: string;
}
