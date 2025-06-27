import { Inject, Injectable } from '@nestjs/common';
import { IReportsRepository } from './interfaces/reports.repository.interface';
import { Pagination } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { ExpenseByGroupModel } from './models/ExpenseByGroup.models';
import {
  ExpenseByDateResult,
  ExpenseByGroupedMonthResult,
  ExpenseByGroupResult,
  ExpenseByStoreResult,
  MostPurchasedItemsResult,
  RevenueByGroupedMonthResult,
} from './types/reportsType';
import { User } from 'src/user/entities/user.entity';
import { ExpenseByGroupDto } from './dto/expense-by-group.dto';
import { ExpenseByStoreDto } from './dto/expense-by-store.dto';
import { ExpenseByStoreModel } from './models/ExpenseByStore.models';
import { ExpenseByDateDto } from './dto/expense-by-date.dto';
import { ExpenseByDateModel } from './models/ExpenseByDate.models';
import { MostPurchasedItemsDto } from './dto/most-purchased-items.dto';
import { MostPurchasedItemsModel } from './models/MostPurchasedItems.models';
import { ExpensesIncomeComparisonDto } from './dto/expenses-income-comparison.dto';
import { ExpensesIncomeComparisonModel } from './models/ExpensesIncomeComparison.models';

@Injectable()
export class ReportsService {
  private url = `${this.appConfig.getBaseUrl()}/reports`;

  constructor(
    @Inject('IReportsRepository')
    private reportsRepository: IReportsRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async expenseByGroup(
    user: User,
    expenseByGroup: ExpenseByGroupDto,
  ): Promise<ExpenseByGroupModel[]> {
    const result = await this.reportsRepository.expenseByGroup(
      user.id,
      expenseByGroup.startDate,
      expenseByGroup.endDate,
    );

    return result.map(
      (item: ExpenseByGroupResult) => new ExpenseByGroupModel(item),
    );
  }

  async expenseByStore(
    user: User,
    expenseByStore: ExpenseByStoreDto,
  ): Promise<ExpenseByStoreModel[]> {
    const result = await this.reportsRepository.expenseByStore(
      user.id,
      expenseByStore.startDate,
      expenseByStore.endDate,
    );

    return result.map(
      (item: ExpenseByStoreResult) => new ExpenseByStoreModel(item),
    );
  }

  async expenseByDate(
    user: User,
    expenseByDate: ExpenseByDateDto,
  ): Promise<ExpenseByDateModel[]> {
    const result = await this.reportsRepository.expenseByDate(
      user.id,
      expenseByDate.startDate,
      expenseByDate.endDate,
    );

    return result.map(
      (item: ExpenseByDateResult) => new ExpenseByDateModel(item),
    );
  }

  async mostPurchasedItems(
    user: User,
    expenseByDate: MostPurchasedItemsDto,
  ): Promise<MostPurchasedItemsModel[]> {
    const result = await this.reportsRepository.mostPurchasedItems(
      user.id,
      expenseByDate.startDate,
      expenseByDate.endDate,
    );

    return result.map(
      (item: MostPurchasedItemsResult) => new MostPurchasedItemsModel(item),
    );
  }

  async expensesIncomeComparison(
    user: User,
    expensesIncomeComparison: ExpensesIncomeComparisonDto,
  ): Promise<ExpensesIncomeComparisonModel[]> {
    const start = `${expensesIncomeComparison.year}-01-01 00:00:00`;
    const end = `${expensesIncomeComparison.year}-12-31 23:59:59`;

    const [expenses, revenues] = await Promise.all([
      this.reportsRepository.expenseByGroupedMonth(user.id, start, end),
      this.reportsRepository.revenueByGroupedMonth(user.id, start, end),
    ]);

    const merged = expenses.map((expense: ExpenseByGroupedMonthResult) => {
      const rev = revenues.find(
        (revenue: RevenueByGroupedMonthResult) =>
          revenue.month === expense.month,
      );
      return new ExpensesIncomeComparisonModel({
        month: expense.month,
        totalExpenses: expense.totalExpenses,
        totalRevenues: rev ? rev.totalRevenues : 0,
      });
    });

    return merged || [];
  }
}
