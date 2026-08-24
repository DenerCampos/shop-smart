import {
  APP_TIMEZONE,
  getLast12MonthsDates,
  getPreviousMonthDates,
  getTodayDateString,
  getZonedDateParts,
  isValidIsoDate,
  nextCalendarDateString,
} from './dates.util';

describe('dates.util — timezone America/Sao_Paulo', () => {
  describe('getZonedDateParts', () => {
    it('uses São Paulo calendar near UTC midnight', () => {
      // 2026-06-01T02:30:00Z = 2026-05-31T23:30 in America/Sao_Paulo
      const parts = getZonedDateParts(
        new Date('2026-06-01T02:30:00.000Z'),
        APP_TIMEZONE,
      );

      expect(parts).toEqual({ year: 2026, month: 5, day: 31 });
    });
  });

  describe('getPreviousMonthDates', () => {
    it('returns May 2026 when now is June 1st in São Paulo', () => {
      const range = getPreviousMonthDates(
        new Date('2026-06-01T03:00:00.000Z'),
        APP_TIMEZONE,
      );

      expect(range.startDateString).toBe('2026-05-01');
      expect(range.endDateString).toBe('2026-05-31');
      expect(range.month).toBe(5);
      expect(range.year).toBe(2026);
      expect(range.totalDays).toBe(31);
    });

    it('returns April 2026 when São Paulo calendar is still May 31st', () => {
      const range = getPreviousMonthDates(
        new Date('2026-06-01T02:30:00.000Z'),
        APP_TIMEZONE,
      );

      expect(range.startDateString).toBe('2026-04-01');
      expect(range.endDateString).toBe('2026-04-30');
      expect(range.month).toBe(4);
      expect(range.year).toBe(2026);
    });

    it('rolls year when previous month is December', () => {
      const range = getPreviousMonthDates(
        new Date('2026-01-15T12:00:00.000Z'),
        APP_TIMEZONE,
      );

      expect(range.startDateString).toBe('2025-12-01');
      expect(range.endDateString).toBe('2025-12-31');
      expect(range.month).toBe(12);
      expect(range.year).toBe(2025);
    });

    it('does not shift date strings via UTC conversion', () => {
      const range = getPreviousMonthDates(
        new Date('2026-03-10T12:00:00.000Z'),
        APP_TIMEZONE,
      );

      expect(range.startDateString).toBe('2026-02-01');
      expect(range.endDateString).toBe('2026-02-28');
    });
  });

  describe('getLast12MonthsDates', () => {
    it('covers 12 inclusive months ending today', () => {
      const range = getLast12MonthsDates(
        new Date('2026-08-24T15:00:00.000Z'),
        APP_TIMEZONE,
      );

      expect(range.startDateString).toBe('2025-09-01');
      expect(range.endDateString).toBe('2026-08-24');
      expect(range.periodDescription).toBe('Últimos 12 meses');
      expect(range.crossesYears).toBe(true);
    });
  });

  describe('getTodayDateString', () => {
    it('uses São Paulo calendar near UTC midnight', () => {
      expect(
        getTodayDateString(new Date('2026-08-25T02:30:00.000Z'), APP_TIMEZONE),
      ).toBe('2026-08-24');
    });
  });

  describe('nextCalendarDateString', () => {
    it('advances to the next day and month/year boundaries', () => {
      expect(nextCalendarDateString('2026-08-24')).toBe('2026-08-25');
      expect(nextCalendarDateString('2026-08-31')).toBe('2026-09-01');
      expect(nextCalendarDateString('2026-12-31')).toBe('2027-01-01');
    });
  });

  describe('isValidIsoDate', () => {
    it('accepts real calendar dates and rejects invalid ones', () => {
      expect(isValidIsoDate('2026-02-28')).toBe(true);
      expect(isValidIsoDate('2026-13-99')).toBe(false);
      expect(isValidIsoDate('2026-02-31')).toBe(false);
      expect(isValidIsoDate('2026-00-10')).toBe(false);
    });
  });
});
