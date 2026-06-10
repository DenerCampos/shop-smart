import { Expose } from 'class-transformer';
import { WarrantyUnit } from '../types/reportsType';

export class WarrantyItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  warrantyDuration: number;

  @Expose()
  warrantyUnit: WarrantyUnit;

  @Expose()
  warrantyExpiresAt: Date;

  @Expose()
  purchaseDate: Date;

  @Expose()
  daysRemaining: number;

  @Expose()
  isExpired: boolean;

  @Expose()
  expenseId: string;

  @Expose()
  expenseName: string;

  @Expose()
  storeName: string | null;

  @Expose()
  userId: string;

  @Expose()
  userName: string;
}
