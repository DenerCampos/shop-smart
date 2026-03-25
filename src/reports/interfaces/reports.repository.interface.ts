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
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupResult[] | []>;
  expenseByStore(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByStoreResult[] | []>;
  expenseByDate(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByDateResult[] | []>;
  mostPurchasedItems(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<MostPurchasedItemsResult[] | []>;
  expenseByGroupedMonth(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupedMonthResult[] | []>;
  revenueByGroupedMonth(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<RevenueByGroupedMonthResult[] | []>;
}
