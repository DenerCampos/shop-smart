import { APP_TIMEZONE } from 'src/common/utils/dates.util';

export const MISSION_TIMEZONE = APP_TIMEZONE;

/** YYYY-MM-DD in mission timezone (en-CA locale). */
export function getLocalDateKey(
  date: Date,
  timeZone = MISSION_TIMEZONE,
): string {
  return date.toLocaleDateString('en-CA', { timeZone });
}

/** YYYY-MM in mission timezone. */
export function getLocalYearMonthKey(
  date: Date,
  timeZone = MISSION_TIMEZONE,
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';

  return `${year}-${month}`;
}

export function isProgressInCurrentDailyPeriod(
  lastUpdatedAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!lastUpdatedAt) return false;
  return getLocalDateKey(lastUpdatedAt) === getLocalDateKey(now);
}

export function isProgressInCurrentMonthlyPeriod(
  lastUpdatedAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!lastUpdatedAt) return false;
  return getLocalYearMonthKey(lastUpdatedAt) === getLocalYearMonthKey(now);
}
