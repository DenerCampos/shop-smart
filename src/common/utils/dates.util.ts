export const APP_TIMEZONE = 'America/Sao_Paulo';

export type DateRange = {
  startDate: Date;
  endDate: Date;
  startDateString: string;
  endDateString: string;
  startDateBR: string;
  endDateBR: string;
  monthName: string;
  year: number;
  month: number;
  totalDays: number;
  periodDescription: string;
  startMonthName: string;
  endMonthName: string;
  startYear: number;
  endYear: number;
  crossesMonths?: boolean;
  crossesYears?: boolean;
};

export const getCurrentMonth = (): number => {
  const now = new Date();
  return now.getMonth() + 1;
};

export const getPreviousMonth = (): number => {
  const now = new Date();
  const previousMonth = now.getMonth(); // getMonth() já retorna 0-11

  // Se for janeiro (0), volta para dezembro (12)
  return previousMonth === 0 ? 12 : previousMonth;
};

export const getCurrentDay = (): number => {
  const now = new Date();
  return now.getDate(); // getDate() retorna o dia do mês (1-31)
};

export function getZonedDateParts(
  date: Date,
  timeZone = APP_TIMEZONE,
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
    day: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calendarDateAtUtcNoon(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function buildMonthDateRange(
  year: number,
  month: number,
  periodDescription: string,
  timeZone = APP_TIMEZONE,
): DateRange {
  const totalDays = getDaysInMonth(year, month);
  const startDateString = toDateString(year, month, 1);
  const endDateString = toDateString(year, month, totalDays);
  const startDate = calendarDateAtUtcNoon(year, month, 1);
  const endDate = calendarDateAtUtcNoon(year, month, totalDays);

  const dateFormatterBR = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const monthNameFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    month: 'long',
  });

  return {
    startDate,
    endDate,
    startDateString,
    endDateString,
    startDateBR: dateFormatterBR.format(startDate),
    endDateBR: dateFormatterBR.format(endDate),
    monthName: monthNameFormatter.format(startDate),
    periodDescription,
    startMonthName: monthNameFormatter.format(startDate),
    endMonthName: monthNameFormatter.format(endDate),
    year,
    month,
    startYear: year,
    endYear: year,
    totalDays,
  };
}

/**
 * Returns the closed previous calendar month in APP_TIMEZONE (America/Sao_Paulo).
 * Date strings are safe for SQL DATE comparisons (YYYY-MM-DD).
 */
export const getPreviousMonthDates = (
  now = new Date(),
  timeZone = APP_TIMEZONE,
): DateRange => {
  const { year, month } = getZonedDateParts(now, timeZone);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  return buildMonthDateRange(prevYear, prevMonth, 'Mês anterior', timeZone);
};

export const getCurrentMonthDates = (): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based (Janeiro = 0)

  // Primeiro dia do mês (dia 1)
  const startDate = new Date(year, month, 1);

  // Último dia do mês (dia 0 do próximo mês)
  const endDate = new Date(year, month + 1, 0);

  return {
    startDate,
    endDate,
    // Retorna no formato string para usar nas queries
    startDateString: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    endDateString: endDate.toISOString().split('T')[0], // YYYY-MM-DD
    // Formato brasileiro DD/MM/YYYY
    startDateBR: startDate.toLocaleDateString('pt-BR'),
    endDateBR: endDate.toLocaleDateString('pt-BR'),
    // Informações adicionais
    monthName: startDate.toLocaleDateString('pt-BR', { month: 'long' }),
    periodDescription: `Mês atual`,
    startMonthName: startDate.toLocaleDateString('pt-BR', { month: 'long' }),
    endMonthName: endDate.toLocaleDateString('pt-BR', { month: 'long' }),
    year: year,
    month: month + 1, // 1-based para exibição
    startYear: startDate.getFullYear(),
    endYear: endDate.getFullYear(),
    totalDays: endDate.getDate(),
  };
};

// Função para obter as datas dos últimos N dias
export const getLastDaysDates = (days: number): DateRange => {
  const now = new Date();

  // Data de hoje (fim do período)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Data de N dias atrás (início do período)
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
  );

  return {
    startDate,
    endDate,
    // Retorna no formato string para usar nas queries
    startDateString: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    endDateString: endDate.toISOString().split('T')[0], // YYYY-MM-DD
    // Formato brasileiro DD/MM/YYYY
    startDateBR: startDate.toLocaleDateString('pt-BR'),
    endDateBR: endDate.toLocaleDateString('pt-BR'),
    // Informações adicionais
    totalDays: days + 1, // +1 porque inclui o dia atual
    periodDescription: `Últimos ${days} dias`,
    startMonthName: startDate.toLocaleDateString('pt-BR', { month: 'long' }),
    endMonthName: endDate.toLocaleDateString('pt-BR', { month: 'long' }),
    startYear: startDate.getFullYear(),
    endYear: endDate.getFullYear(),
    // Verifica se o período cruza meses diferentes
    crossesMonths: startDate.getMonth() !== endDate.getMonth(),
    // Verifica se o período cruza anos diferentes
    crossesYears: startDate.getFullYear() !== endDate.getFullYear(),
    monthName: startDate.toLocaleDateString('pt-BR', { month: 'long' }),
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-based para exibição
  };
};

export const formatToMySQLDateTime = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

export const getFirstDayOfMonth = (): string => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatToMySQLDateTime(firstDay);
};

export const getLastDayOfMonth = (): string => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  return formatToMySQLDateTime(lastDay);
};

export const addTimeIfMissing = (
  dateString: string,
  isEndDate = false,
): string => {
  // Se for só data (YYYY-MM-DD)
  if (dateString.length === 10) {
    return isEndDate ? `${dateString} 23:59:59` : `${dateString} 00:00:00`;
  }
  return dateString;
};

export const addOneMonth = (dateString: string | Date): Date => {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    const originalDay = date.getDate();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Cria uma nova data com o próximo mês
    const nextMonth = currentMonth + 1;
    let newYear = currentYear;
    let newMonth = nextMonth;

    // Se passou de dezembro, vai para janeiro do próximo ano
    if (nextMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }

    // Tenta criar a data com o dia original
    let newDate = new Date(newYear, newMonth, originalDay);

    // Se o dia mudou, significa que o dia não existe no mês de destino
    // Por exemplo: 31 de janeiro -> 31 de fevereiro (não existe)
    if (newDate.getDate() !== originalDay) {
      // Pega o último dia do mês de destino
      const lastDayOfMonth = new Date(newYear, newMonth + 1, 0).getDate();
      newDate = new Date(newYear, newMonth, lastDayOfMonth);
    }

    return newDate;
  } catch (error) {
    console.error('Erro ao adicionar um mês à data:', error);
    throw new Error('Data inválida');
  }
};

export const setSpecificMonth = (
  dateString: string | Date,
  targetMonth: number,
): Date => {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    if (targetMonth < 1 || targetMonth > 12) {
      throw new Error('Mês inválido. Deve estar entre 1 e 12');
    }

    const originalDay = date.getDate();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Ajusta o mês para o formato 0-11 usado pelo JavaScript
    const newMonth = targetMonth - 1;

    // Define o ano baseado no mês alvo
    let newYear = currentYear;
    if (newMonth < currentMonth) {
      newYear = currentYear + 1;
    }

    // Tenta criar a data com o dia original
    let newDate = new Date(newYear, newMonth, originalDay);

    // Se o dia mudou, significa que o dia não existe no mês de destino
    // Por exemplo: 31 de janeiro -> 31 de fevereiro (não existe)
    if (newDate.getDate() !== originalDay) {
      // Pega o último dia do mês de destino
      const lastDayOfMonth = new Date(newYear, newMonth + 1, 0).getDate();
      newDate = new Date(newYear, newMonth, lastDayOfMonth);
    }

    return newDate;
  } catch (error) {
    console.error('Erro ao definir mês específico na data:', error);
    throw new Error('Erro ao processar a data');
  }
};

// Função auxiliar para adicionar N meses
export const addMonths = (
  dateString: string | Date,
  monthsToAdd: number,
): Date => {
  try {
    let currentDate =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    for (let i = 0; i < Math.abs(monthsToAdd); i++) {
      if (monthsToAdd > 0) {
        currentDate = addOneMonth(currentDate);
      } else {
        currentDate = subtractOneMonth(currentDate);
      }
    }

    return currentDate;
  } catch (error) {
    console.error('Erro ao adicionar meses à data:', error);
    throw new Error('Data inválida');
  }
};

// Função para subtrair um mês (caso seja útil)
export const subtractOneMonth = (dateString: string | Date): Date => {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    const originalDay = date.getDate();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Cria uma nova data com o mês anterior
    const previousMonth = currentMonth - 1;
    let newYear = currentYear;
    let newMonth = previousMonth;

    // Se passou de janeiro, vai para dezembro do ano anterior
    if (previousMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    }

    // Tenta criar a data com o dia original
    let newDate = new Date(newYear, newMonth, originalDay);

    // Se o dia mudou, pega o último dia do mês de destino
    if (newDate.getDate() !== originalDay) {
      const lastDayOfMonth = new Date(newYear, newMonth + 1, 0).getDate();
      newDate = new Date(newYear, newMonth, lastDayOfMonth);
    }

    return newDate;
  } catch (error) {
    console.error('Erro ao subtrair um mês da data:', error);
    throw new Error('Data inválida');
  }
};
