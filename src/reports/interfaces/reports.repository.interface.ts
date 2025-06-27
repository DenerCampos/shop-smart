import {
  ExpenseByDateResult,
  ExpenseByGroupedMonthResult,
  ExpenseByGroupResult,
  ExpenseByStoreResult,
  MostPurchasedItemsResult,
  RevenueByGroupedMonthResult,
} from '../types/reportsType';

export interface IReportsRepository {
  expenseByGroup(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupResult[] | []>;
  expenseByStore(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByStoreResult[] | []>;
  expenseByDate(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByDateResult[] | []>;
  mostPurchasedItems(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<MostPurchasedItemsResult[] | []>;
  expenseByGroupedMonth(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupedMonthResult[] | []>;
  revenueByGroupedMonth(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<RevenueByGroupedMonthResult[] | []>;
}
