import { Expose } from 'class-transformer';

export class MostPurchasedItemsResponseDto {
  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  value: number;
}
