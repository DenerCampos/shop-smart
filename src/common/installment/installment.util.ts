import { randomUUID } from 'node:crypto';
import {
  APP_TIMEZONE,
  getZonedDateParts,
  parseCalendarDateInput,
} from '../utils/dates.util';
import type {
  InstallmentIntervalUnit,
  InstallmentMeta,
  InstallmentSlice,
  RecurrenceConfigDto,
  WarrantyUnit,
} from './installment.types';

export const MAX_PHOTOS_PER_FINANCIAL = 5;
const INSTALLMENT_DATE_UTC_HOUR = 12;

export function getCalendarParts(date: Date | string): {
  year: number;
  month: number;
  day: number;
} {
  const normalized = parseCalendarDateInput(date);
  const zoned = getZonedDateParts(normalized, APP_TIMEZONE);
  return {
    year: zoned.year,
    month: zoned.month - 1,
    day: zoned.day,
  };
}

export function toInstallmentCalendarDate(date: Date | string): Date {
  return parseCalendarDateInput(date);
}

export function buildInstallmentLabel(
  installmentNumber: number | null | undefined,
  totalInstallments: number | null | undefined,
): string | null {
  if (!installmentNumber) return null;
  if (totalInstallments == null) {
    return `Parcela ${installmentNumber} de ∞`;
  }
  return `Parcela ${installmentNumber} de ${totalInstallments}`;
}

export function splitInstallmentValues(
  totalValue: number,
  count: number,
): number[] {
  if (count <= 0) return [];
  const totalCents = Math.round(totalValue * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const cents = base + (i === count - 1 ? remainder : 0);
    values.push(Number((cents / 100).toFixed(2)));
  }
  return values;
}

function addInterval(
  date: Date,
  unit: InstallmentIntervalUnit,
  value: number,
  dueDay?: number,
): Date {
  const { year, month, day } = getCalendarParts(date);

  if (unit === 'days') {
    return toInstallmentCalendarDate(
      new Date(Date.UTC(year, month, day + value, INSTALLMENT_DATE_UTC_HOUR)),
    );
  }

  if (unit === 'months') {
    const targetMonth = month + value;
    const lastDay = new Date(
      Date.UTC(year, targetMonth + 1, 0, INSTALLMENT_DATE_UTC_HOUR),
    ).getUTCDate();
    const targetDay =
      dueDay != null && dueDay >= 1 && dueDay <= 31
        ? Math.min(dueDay, lastDay)
        : day;
    return new Date(
      Date.UTC(
        year,
        targetMonth,
        targetDay,
        INSTALLMENT_DATE_UTC_HOUR,
        0,
        0,
        0,
      ),
    );
  }

  const targetYear = year + value;
  const lastDay = new Date(
    Date.UTC(targetYear, month + 1, 0, INSTALLMENT_DATE_UTC_HOUR),
  ).getUTCDate();
  const targetDay =
    dueDay != null && dueDay >= 1 && dueDay <= 31
      ? Math.min(dueDay, lastDay)
      : day;
  return new Date(
    Date.UTC(targetYear, month, targetDay, INSTALLMENT_DATE_UTC_HOUR, 0, 0, 0),
  );
}

export function buildInstallmentSchedule(
  startDate: Date,
  totalValue: number,
  count: number,
  intervalUnit: InstallmentIntervalUnit = 'months',
  intervalValue = 1,
  dueDay?: number,
): InstallmentSlice[] {
  const values = splitInstallmentValues(totalValue, count);
  const slices: InstallmentSlice[] = [];
  let currentDate = toInstallmentCalendarDate(startDate);

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      currentDate = addInterval(
        currentDate,
        intervalUnit,
        intervalValue,
        dueDay,
      );
    }
    slices.push({
      installmentNumber: i + 1,
      value: values[i],
      date: new Date(currentDate),
    });
  }

  return slices;
}

export function resolveRecurrenceMeta(
  recurrence: RecurrenceConfigDto | undefined,
  installmentNumber = 1,
): Omit<InstallmentMeta, 'installmentGroupId'> & {
  installmentGroupId: string | null;
} {
  if (!recurrence?.enabled || recurrence.mode === 'none') {
    return {
      installmentGroupId: null,
      installmentNumber: null,
      totalInstallments: null,
      isInstallment: false,
      repeat: false,
    };
  }

  const groupId = randomUUID();

  if (recurrence.mode === 'fixed_repeat') {
    return {
      installmentGroupId: groupId,
      installmentNumber: null,
      totalInstallments: null,
      isInstallment: false,
      repeat: true,
    };
  }

  if (recurrence.mode === 'installment_infinite') {
    return {
      installmentGroupId: groupId,
      installmentNumber,
      totalInstallments: null,
      isInstallment: true,
      repeat: true,
    };
  }

  return {
    installmentGroupId: groupId,
    installmentNumber,
    totalInstallments: recurrence.count ?? null,
    isInstallment: true,
    repeat: false,
  };
}

export function extractDueDayFromDate(date: Date | string): number {
  return getCalendarParts(date).day;
}

export function buildRecurrenceResponseFromExpense(
  expense: {
    repeat: boolean;
    isInstallment: boolean;
    totalInstallments: number | null;
    date: Date | string;
  },
  groupMembers: Array<{
    installmentNumber: number | null;
    date: Date | string;
  }> = [],
): RecurrenceConfigDto {
  const secondInstallment = groupMembers.find(
    (member) => member.installmentNumber === 2,
  );
  const dueDay = secondInstallment
    ? extractDueDayFromDate(secondInstallment.date)
    : expense.isInstallment
      ? 10
      : extractDueDayFromDate(expense.date);

  const defaults = {
    intervalUnit: 'months' as InstallmentIntervalUnit,
    intervalValue: 1,
    dueDay,
  };

  if (expense.isInstallment && expense.totalInstallments != null) {
    return {
      enabled: true,
      mode: 'installment_finite',
      count: expense.totalInstallments,
      ...defaults,
    };
  }

  if (expense.isInstallment && expense.totalInstallments == null) {
    return {
      enabled: true,
      mode: 'installment_infinite',
      count: 2,
      ...defaults,
    };
  }

  if (expense.repeat) {
    return {
      enabled: true,
      mode: 'fixed_repeat',
      count: 2,
      ...defaults,
    };
  }

  return {
    enabled: false,
    mode: 'none',
    count: 2,
    intervalUnit: 'months',
    intervalValue: 1,
    dueDay: 10,
  };
}

export function normalizeItemWarranty(
  item: {
    warrantyDuration?: number | null;
    warrantyUnit?: string | null;
  },
  baseDate: Date,
): {
  warrantyDuration: number | null;
  warrantyUnit: WarrantyUnit | null;
  warrantyExpiresAt: Date | null;
} {
  const duration = item.warrantyDuration ? Number(item.warrantyDuration) : null;
  const unit = item.warrantyUnit as WarrantyUnit | null | undefined;

  if (!duration || !unit) {
    return {
      warrantyDuration: null,
      warrantyUnit: null,
      warrantyExpiresAt: null,
    };
  }

  return {
    warrantyDuration: duration,
    warrantyUnit: unit,
    warrantyExpiresAt: computeWarrantyExpiresAt(baseDate, duration, unit),
  };
}

export function computeReceiptAmounts(
  expense: {
    value: number | string;
    isInstallment: boolean;
    installmentGroupId?: string | null;
    totalInstallments?: number | null;
  },
  groupMembers: Array<{ value: number | string }> = [],
  itemsTotal?: number,
): { installmentValue: number; totalValue: number } {
  const installmentValue = Number(expense.value);

  if (!expense.isInstallment) {
    return { installmentValue, totalValue: installmentValue };
  }

  if (groupMembers.length > 0) {
    return {
      installmentValue,
      totalValue: groupMembers.reduce((sum, m) => sum + Number(m.value), 0),
    };
  }

  if (itemsTotal != null && itemsTotal > 0) {
    return { installmentValue, totalValue: itemsTotal };
  }

  if (expense.totalInstallments != null && expense.totalInstallments > 0) {
    return {
      installmentValue,
      totalValue: Number(
        (installmentValue * expense.totalInstallments).toFixed(2),
      ),
    };
  }

  return { installmentValue, totalValue: installmentValue };
}

export function computeWarrantyExpiresAt(
  baseDate: Date,
  duration: number,
  unit: 'days' | 'months' | 'years',
): Date {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  const hours = baseDate.getUTCHours();
  const minutes = baseDate.getUTCMinutes();
  const seconds = baseDate.getUTCSeconds();

  if (unit === 'days') {
    return new Date(
      Date.UTC(year, month, day + duration, hours, minutes, seconds),
    );
  }
  if (unit === 'months') {
    const targetMonth = month + duration;
    const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
    return new Date(
      Date.UTC(
        year,
        targetMonth,
        Math.min(day, lastDay),
        hours,
        minutes,
        seconds,
      ),
    );
  }
  return new Date(
    Date.UTC(year + duration, month, day, hours, minutes, seconds),
  );
}

export function isFiniteInstallmentVisibleInCurrentMonth(
  date: Date,
  now = new Date(),
): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}
