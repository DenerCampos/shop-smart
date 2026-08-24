import {
  APP_TIMEZONE,
  getLast12MonthsDates,
  getZonedDateParts,
  isValidIsoDate,
} from 'src/common/utils/dates.util';

export type ChatPeriodScope =
  | 'custom'
  | 'last_12_months'
  | 'all_time'
  | 'month'
  | 'all';

export type ChatPeriod = {
  from: string | null;
  to: string | null;
  scope: ChatPeriodScope;
  label: string;
  /** Limite de registros quando scope = all_time (últimos N). */
  limit?: number;
};

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function asDateString(value: unknown): string | null {
  if (value == null || value === '') return null;
  const raw = String(value).trim().slice(0, 10);
  return isValidIsoDate(raw) ? raw : null;
}

function parseLastN(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.floor(n), 100);
}

function formatDateBr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function formatMonthYear(iso: string): string {
  const [, m, ,] = iso.split('-');
  const month = Number(m);
  const year = Number(iso.slice(0, 4));
  return `${MONTH_NAMES_PT[month - 1]}/${year}`;
}

/**
 * Resolve o recorte temporal das tools do Assistente Familiar.
 * Prioridade: from/to explícitos → lastN (base inteira) → últimos 12 meses.
 */
export function resolveChatPeriod(args: {
  from?: unknown;
  to?: unknown;
  lastN?: unknown;
}): ChatPeriod {
  const fromArg = asDateString(args.from);
  const toArg = asDateString(args.to);
  const lastN = parseLastN(args.lastN);

  if (fromArg || toArg) {
    const fallback = getLast12MonthsDates();
    let from = fromArg ?? fallback.startDateString;
    let to = toArg ?? fallback.endDateString;
    if (from > to) {
      const swapped = from;
      from = to;
      to = swapped;
    }
    return {
      from,
      to,
      scope: 'custom',
      label: `busquei de ${formatDateBr(from)} a ${formatDateBr(to)}`,
      limit: lastN ?? undefined,
    };
  }

  if (lastN != null) {
    return {
      from: null,
      to: null,
      scope: 'all_time',
      label: `busquei em toda a base (últimos ${lastN})`,
      limit: lastN,
    };
  }

  const range = getLast12MonthsDates();
  return {
    from: range.startDateString,
    to: range.endDateString,
    scope: 'last_12_months',
    label: `busquei de ${formatMonthYear(range.startDateString)} a ${formatMonthYear(range.endDateString)} (últimos 12 meses)`,
  };
}

/** Recorte de um mês civil (tools mensais: balanço, família, payroll…). */
export function resolveMonthPeriod(
  month?: unknown,
  year?: unknown,
  now = new Date(),
): ChatPeriod {
  const parts = getZonedDateParts(now, APP_TIMEZONE);
  const m = Number(month) || parts.month;
  const y = Number(year) || parts.year;
  const totalDays = new Date(y, m, 0).getDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const to = `${y}-${String(m).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
  const monthName = MONTH_NAMES_PT[m - 1] ?? String(m);
  return {
    from,
    to,
    scope: 'month',
    label: `busquei só ${monthName}/${y}`,
  };
}

/** Cadastros sem linha do tempo (lojas, categorias, temas…). */
export function resolveAllCatalogPeriod(): ChatPeriod {
  return {
    from: null,
    to: null,
    scope: 'all',
    label: 'busquei em toda a base',
  };
}

export function defaultItemLimit(period: ChatPeriod): number {
  return period.limit ?? 100;
}
