import { Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { ItemResponseDto } from 'src/expense/dto/item-response.dto';
import { PaymentResponseDto } from 'src/payment/dto/payment-response.dto';
import { StoreResponseDto } from 'src/store/dto/store-response.dto';

export class InstallmentInfoDto {
  @Expose()
  installmentNumber: number | null;

  @Expose()
  totalInstallments: number | null;

  @Expose()
  installmentGroupId: string | null;

  @Expose()
  isInstallment: boolean;

  @Expose()
  installmentLabel: string | null;
}

export class ExpenseReceiptDto {
  @Expose()
  id: string;

  @Expose()
  type: 'expense';

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  installmentValue: number;

  @Expose()
  totalValue: number;

  @Expose()
  date: Date;

  @Expose()
  uri: string;

  @Expose()
  photos: string[];

  @Expose()
  isInstallmentRoot: boolean;

  @Expose()
  @Type(() => InstallmentInfoDto)
  installment: InstallmentInfoDto;

  @Expose()
  @Type(() => StoreResponseDto)
  store: StoreResponseDto;

  @Expose()
  @Type(() => PaymentResponseDto)
  payment: PaymentResponseDto;

  @Expose()
  @Type(() => ItemResponseDto)
  items: ItemResponseDto[];

  @Expose()
  @Type(() => OwnerResponseDto)
  user: OwnerResponseDto;
}

export class RevenueReceiptDto {
  @Expose()
  id: string;

  @Expose()
  type: 'revenue';

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  installmentValue: number;

  @Expose()
  totalValue: number;

  @Expose()
  date: Date;

  @Expose()
  photos: string[];

  @Expose()
  @Type(() => InstallmentInfoDto)
  installment: InstallmentInfoDto;

  @Expose()
  @Type(() => OwnerResponseDto)
  user: OwnerResponseDto;
}
