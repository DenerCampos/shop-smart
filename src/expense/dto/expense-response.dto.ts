import { Exclude, Expose, Type } from 'class-transformer';
import { ItemResponseDto } from './item-response.dto';
import { PaymentResponseDto } from 'src/payment/dto/payment-response.dto';
import { StoreResponseDto } from 'src/store/dto/store-response.dto';

export class ExpenseResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  uri: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => PaymentResponseDto)
  payment: PaymentResponseDto;

  @Expose()
  @Type(() => StoreResponseDto)
  store: StoreResponseDto;

  @Expose()
  @Type(() => ItemResponseDto)
  items: ItemResponseDto[];
}
