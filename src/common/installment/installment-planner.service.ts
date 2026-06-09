import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  buildInstallmentSchedule,
  normalizeItemWarranty,
  resolveRecurrenceMeta,
} from './installment.util';
import type { RecurrenceConfigDto } from './installment.types';

export type ResolvedInstallmentMeta = {
  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  isInstallment: boolean;
  repeat: boolean;
};

@Injectable()
export class InstallmentPlannerService {
  resolveMeta(
    recurrence?: RecurrenceConfigDto,
    legacyRepeat?: boolean,
    installmentNumber = 1,
  ): ResolvedInstallmentMeta {
    if (recurrence?.enabled) {
      return resolveRecurrenceMeta(recurrence, installmentNumber);
    }
    if (legacyRepeat) {
      return {
        installmentGroupId: null,
        installmentNumber: null,
        totalInstallments: null,
        isInstallment: false,
        repeat: true,
      };
    }
    return resolveRecurrenceMeta(undefined, installmentNumber);
  }

  resolveMetaForUpdate(
    recurrence: RecurrenceConfigDto | undefined,
    legacyRepeat: boolean | undefined,
    existing: {
      installmentGroupId?: string | null;
      installmentNumber?: number | null;
      totalInstallments?: number | null;
      isInstallment?: boolean;
      repeat?: boolean;
    } | null,
    installmentNumber = 1,
  ): ResolvedInstallmentMeta {
    if (!recurrence?.enabled || recurrence.mode === 'none') {
      if (legacyRepeat) {
        return {
          installmentGroupId: null,
          installmentNumber: null,
          totalInstallments: null,
          isInstallment: false,
          repeat: true,
        };
      }
      return {
        installmentGroupId: null,
        installmentNumber: null,
        totalInstallments: null,
        isInstallment: false,
        repeat: false,
      };
    }

    const meta = resolveRecurrenceMeta(recurrence, installmentNumber);

    if (
      existing?.installmentGroupId &&
      (recurrence.mode === 'installment_finite' ||
        recurrence.mode === 'installment_infinite')
    ) {
      meta.installmentGroupId = existing.installmentGroupId;
    }

    if (recurrence.mode === 'installment_finite') {
      meta.totalInstallments =
        recurrence.count ?? existing?.totalInstallments ?? null;
    }

    if (recurrence.mode === 'installment_infinite') {
      meta.totalInstallments = null;
    }

    meta.installmentNumber = installmentNumber;
    return meta;
  }

  isFiniteInstallment(recurrence?: RecurrenceConfigDto): boolean {
    return (
      recurrence?.enabled === true &&
      recurrence.mode === 'installment_finite' &&
      (recurrence.count ?? 0) >= 2
    );
  }

  buildFiniteSchedule(
    startDate: Date,
    totalValue: number,
    recurrence: RecurrenceConfigDto,
  ) {
    return buildInstallmentSchedule(
      startDate,
      totalValue,
      recurrence.count ?? 2,
      recurrence.intervalUnit ?? 'months',
      recurrence.intervalValue ?? 1,
      recurrence.dueDay,
    );
  }

  normalizeItemWarranty(
    item: {
      warrantyDuration?: number | null;
      warrantyUnit?: string | null;
    },
    baseDate: Date,
  ) {
    return normalizeItemWarranty(item, baseDate);
  }

  mergeInstallmentFields(
    base: Record<string, unknown>,
    meta: ResolvedInstallmentMeta,
    photos: string[] = [],
  ): Record<string, unknown> {
    return {
      ...base,
      repeat: meta.repeat,
      installmentGroupId: meta.installmentGroupId,
      installmentNumber: meta.installmentNumber,
      totalInstallments: meta.totalInstallments,
      isInstallment: meta.isInstallment,
      photos,
    };
  }

  nextInfiniteInstallmentNumber(current: number | null | undefined): number {
    return (current ?? 0) + 1;
  }

  shouldIncludeInLatestRegistrations(
    isInstallment: boolean,
    totalInstallments: number | null,
    date: Date,
    now = new Date(),
  ): boolean {
    if (!isInstallment || totalInstallments == null) {
      return true;
    }
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }
}
