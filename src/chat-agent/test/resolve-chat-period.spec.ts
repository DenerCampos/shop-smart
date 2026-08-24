import {
  resolveAllCatalogPeriod,
  resolveChatPeriod,
  resolveMonthPeriod,
} from '../utils/resolve-chat-period';
import { getLast12MonthsDates } from 'src/common/utils/dates.util';

describe('resolveChatPeriod', () => {
  it('usa from/to explícitos com scope custom', () => {
    const period = resolveChatPeriod({
      from: '2026-01-01',
      to: '2026-03-31',
    });

    expect(period).toEqual({
      from: '2026-01-01',
      to: '2026-03-31',
      scope: 'custom',
      label: 'busquei de 01/01/2026 a 31/03/2026',
      limit: undefined,
    });
  });

  it('completa from ou to faltante com fallback de 12 meses', () => {
    const fallback = getLast12MonthsDates();
    const onlyFrom = resolveChatPeriod({ from: '2025-06-01' });
    expect(onlyFrom.from).toBe('2025-06-01');
    expect(onlyFrom.to).toBe(fallback.endDateString);
    expect(onlyFrom.scope).toBe('custom');

    const onlyTo = resolveChatPeriod({ to: '2026-02-28' });
    expect(onlyTo.from).toBe(fallback.startDateString);
    expect(onlyTo.to).toBe('2026-02-28');
  });

  it('com lastN e sem datas usa toda a base', () => {
    const period = resolveChatPeriod({ lastN: 20 });
    expect(period).toEqual({
      from: null,
      to: null,
      scope: 'all_time',
      label: 'busquei em toda a base (últimos 20)',
      limit: 20,
    });
  });

  it('limita lastN a 100', () => {
    expect(resolveChatPeriod({ lastN: 500 }).limit).toBe(100);
  });

  it('sem data e sem lastN usa últimos 12 meses', () => {
    const range = getLast12MonthsDates();
    const period = resolveChatPeriod({});
    expect(period.scope).toBe('last_12_months');
    expect(period.from).toBe(range.startDateString);
    expect(period.to).toBe(range.endDateString);
    expect(period.label).toContain('últimos 12 meses');
    expect(period.label).toMatch(/^busquei de /);
  });

  it('from/to tem prioridade sobre lastN', () => {
    const period = resolveChatPeriod({
      from: '2026-01-01',
      to: '2026-01-31',
      lastN: 5,
    });
    expect(period.scope).toBe('custom');
    expect(period.from).toBe('2026-01-01');
    expect(period.limit).toBe(5);
  });

  it('ignora data inválida de calendário', () => {
    const range = getLast12MonthsDates();
    const period = resolveChatPeriod({ from: '2026-13-99', to: '2026-02-31' });
    expect(period.scope).toBe('last_12_months');
    expect(period.from).toBe(range.startDateString);
    expect(period.to).toBe(range.endDateString);
  });

  it('inverte from/to quando from é posterior a to', () => {
    const period = resolveChatPeriod({
      from: '2026-03-31',
      to: '2026-01-01',
    });
    expect(period.from).toBe('2026-01-01');
    expect(period.to).toBe('2026-03-31');
    expect(period.label).toBe('busquei de 01/01/2026 a 31/03/2026');
  });
});

describe('resolveMonthPeriod', () => {
  it('monta label do mês e datas do calendário', () => {
    const period = resolveMonthPeriod(8, 2026);
    expect(period).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
      scope: 'month',
      label: 'busquei só agosto/2026',
    });
  });
});

describe('resolveAllCatalogPeriod', () => {
  it('marca cadastro sem linha do tempo', () => {
    expect(resolveAllCatalogPeriod()).toEqual({
      from: null,
      to: null,
      scope: 'all',
      label: 'busquei em toda a base',
    });
  });
});

describe('getLast12MonthsDates', () => {
  it('de setembro/2025 a 24/08/2026 quando agora é 24/08/2026 em SP', () => {
    const range = getLast12MonthsDates(
      new Date('2026-08-24T15:00:00.000Z'),
      'America/Sao_Paulo',
    );
    expect(range.startDateString).toBe('2025-09-01');
    expect(range.endDateString).toBe('2026-08-24');
  });
});
