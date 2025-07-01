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
