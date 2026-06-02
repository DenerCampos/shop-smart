import { calcNextScheduledDate } from './calc-next-scheduled-date.util';

describe('calcNextScheduledDate', () => {
  it('daily — avança até o primeiro instante estritamente após approvedAt', () => {
    const anchor = new Date(2026, 4, 1, 10, 0, 0);
    const approvedAt = new Date(2026, 4, 2, 10, 0, 0);
    const result = calcNextScheduledDate(anchor, 'daily', approvedAt);
    expect(result.getTime()).toBe(new Date(2026, 4, 3, 10, 0, 0).getTime());
  });

  it('weekly — usa passos de 7 dias a partir do anchor', () => {
    const anchor = new Date(2026, 4, 5, 8, 0, 0);
    const approvedAt = new Date(2026, 4, 12, 8, 0, 0);
    const result = calcNextScheduledDate(anchor, 'weekly', approvedAt);
    expect(result.getTime()).toBe(new Date(2026, 4, 19, 8, 0, 0).getTime());
  });

  it('quando o primeiro slot já é depois de approvedAt, retorna esse slot', () => {
    const anchor = new Date(2026, 4, 1, 10, 0, 0);
    const approvedAt = new Date(2026, 3, 1, 10, 0, 0);
    const result = calcNextScheduledDate(anchor, 'daily', approvedAt);
    expect(result.getTime()).toBe(new Date(2026, 4, 2, 10, 0, 0).getTime());
  });
});
