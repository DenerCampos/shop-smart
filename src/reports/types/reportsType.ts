export type ReportsType = {
  // Defina aqui os tipos relacionados ao módulo
};

export interface ExpenseByGroupResult {
  name: string;
  value: number;
}

export interface ExpenseByStoreResult {
  name: string;
  value: number;
}

export interface ExpenseByDateResult {
  value: number;
  date: Date;
}

export interface MostPurchasedItemsResult {
  name: string;
  quantity: number;
  value: number;
}

export interface MostPurchasedItemsResult {
  name: string;
  quantity: number;
  value: number;
}

export interface ExpenseByGroupedMonthResult {
  month: Date;
  totalExpenses: number;
}

export interface RevenueByGroupedMonthResult {
  month: Date;
  totalRevenues: number;
}
