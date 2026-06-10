import {
  ExpenseByDateResult,
  ExpenseByGroupedMonthResult,
  ExpenseByGroupResult,
  ExpenseByStoreResult,
  MostPurchasedItemsResult,
  RevenueByGroupedMonthResult,
  WarrantyItemsResult,
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
  warrantyItems(
    userIds: string[],
    year: string,
    search: string,
    includeExpired: boolean,
    limit: number,
    offset: number,
  ): Promise<WarrantyItemsResult[]>;
  warrantyItemsCount(
    userIds: string[],
    year: string,
    search: string,
    includeExpired: boolean,
  ): Promise<number>;
}
