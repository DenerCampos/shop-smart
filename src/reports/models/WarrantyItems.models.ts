import { WarrantyUnit } from '../types/reportsType';

export class WarrantyItemModel {
  id: string;
  name: string;
  quantity: number;
  warrantyDuration: number;
  warrantyUnit: WarrantyUnit;
  warrantyExpiresAt: Date;
  purchaseDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  expenseId: string;
  expenseName: string;
  storeName: string | null;
  userId: string;
  userName: string;

  constructor(data: Partial<WarrantyItemModel>) {
    Object.assign(this, data);
  }
}
