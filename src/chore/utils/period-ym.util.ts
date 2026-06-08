export function toPeriodYm(d: Date): number {
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

export function previousPeriodYm(reference: Date): number {
  const d = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return toPeriodYm(d);
}

export function nextPeriodYm(periodYm: number): number {
  const year = Math.floor(periodYm / 100);
  const month = periodYm % 100;
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return toPeriodYm(d);
}

/** Último instante do calendário do período YYYYMM (fuso local do servidor). */
export function lastDayOfPeriodYm(periodYm: number): Date {
  const year = Math.floor(periodYm / 100);
  const month = periodYm % 100;
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function formatPeriodYmLabel(periodYm: number): string {
  const year = Math.floor(periodYm / 100);
  const month = periodYm % 100;
  return `${String(month).padStart(2, '0')}/${year}`;
}
