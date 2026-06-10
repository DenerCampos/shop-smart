import { Exclude, Expose, Type } from 'class-transformer';
import { ItemResponseDto } from './item-response.dto';
import { PaymentResponseDto } from 'src/payment/dto/payment-response.dto';
import { StoreResponseDto } from 'src/store/dto/store-response.dto';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { RecurrenceResponseDto } from 'src/common/dto/financial-recurrence-response.dto';

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
  installmentGroupId: string | null;

  @Expose()
  installmentNumber: number | null;

  @Expose()
  totalInstallments: number | null;

  @Expose()
  isInstallment: boolean;

  @Expose()
  installmentLabel: string | null;

  @Expose()
  photos: string[];

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

  @Expose()
  @Type(() => RecurrenceResponseDto)
  recurrence: RecurrenceResponseDto;

  @Expose()
  @Type(() => OwnerResponseDto)
  user: OwnerResponseDto;
}
