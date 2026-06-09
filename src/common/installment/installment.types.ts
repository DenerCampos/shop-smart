export type InstallmentIntervalUnit = 'days' | 'months' | 'years';

export type RecurrenceMode =
  | 'none'
  | 'installment_finite'
  | 'installment_infinite'
  | 'fixed_repeat';

export type WarrantyUnit = 'days' | 'months' | 'years';

export interface RecurrenceConfigDto {
  enabled: boolean;
  mode: RecurrenceMode;
  count?: number;
  intervalUnit?: InstallmentIntervalUnit;
  intervalValue?: number;
  dueDay?: number;
}

export interface InstallmentSlice {
  installmentNumber: number;
  value: number;
  date: Date;
}

export interface InstallmentMeta {
  installmentGroupId: string;
  installmentNumber: number;
  totalInstallments: number | null;
  isInstallment: boolean;
  repeat: boolean;
}
