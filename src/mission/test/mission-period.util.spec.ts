import {
  isProgressInCurrentDailyPeriod,
  isProgressInCurrentMonthlyPeriod,
  getLocalDateKey,
  getLocalYearMonthKey,
} from '../utils/mission-period.util';

describe('mission-period.util', () => {
  describe('getLocalDateKey', () => {
    it('formats date in America/Sao_Paulo', () => {
      const date = new Date('2026-06-05T03:00:00.000Z');
      expect(getLocalDateKey(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isProgressInCurrentDailyPeriod', () => {
    it('returns true when lastUpdatedAt is today', () => {
      const now = new Date();
      expect(isProgressInCurrentDailyPeriod(now, now)).toBe(true);
    });

    it('returns false when lastUpdatedAt is yesterday', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isProgressInCurrentDailyPeriod(yesterday, now)).toBe(false);
    });

    it('returns false when lastUpdatedAt is null', () => {
      expect(isProgressInCurrentDailyPeriod(null)).toBe(false);
    });
  });

  describe('isProgressInCurrentMonthlyPeriod', () => {
    it('returns true when lastUpdatedAt is in the same month', () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      const sameMonth = new Date('2026-06-01T12:00:00.000Z');

      expect(getLocalYearMonthKey(now)).toBe(getLocalYearMonthKey(sameMonth));
      expect(isProgressInCurrentMonthlyPeriod(sameMonth, now)).toBe(true);
    });

    it('returns false when lastUpdatedAt is in the previous month', () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      const previousMonth = new Date('2026-05-31T12:00:00.000Z');

      expect(isProgressInCurrentMonthlyPeriod(previousMonth, now)).toBe(false);
    });
  });
});
