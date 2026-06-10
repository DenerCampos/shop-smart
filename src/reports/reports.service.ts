import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
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
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { WarrantyItemsQueryDto } from './dto/warranty-items-query.dto';
import { WarrantyItemModel } from './models/WarrantyItems.models';
import { WarrantyItemsResult } from './types/reportsType';
import { paginationData } from 'src/common/pagination/pagination';

@Injectable()
export class ReportsService {
  private url = `${this.appConfig.getBaseUrl()}/reports`;

  constructor(
    @Inject('IReportsRepository')
    private reportsRepository: IReportsRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private familyGroupService: FamilyGroupService,
  ) {}

  async expenseByGroup(
    user: User,
    expenseByGroup: ExpenseByGroupDto,
  ): Promise<ExpenseByGroupModel[]> {
    const userIds = await this.resolveUserIds(user, expenseByGroup.userId);

    const result = await this.reportsRepository.expenseByGroup(
      userIds,
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
    const userIds = await this.resolveUserIds(user, expenseByStore.userId);

    const result = await this.reportsRepository.expenseByStore(
      userIds,
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
    const userIds = await this.resolveUserIds(user, expenseByDate.userId);

    const result = await this.reportsRepository.expenseByDate(
      userIds,
      expenseByDate.startDate,
      expenseByDate.endDate,
    );

    return result.map(
      (item: ExpenseByDateResult) => new ExpenseByDateModel(item),
    );
  }

  async mostPurchasedItems(
    user: User,
    mostPurchasedItems: MostPurchasedItemsDto,
  ): Promise<MostPurchasedItemsModel[]> {
    const userIds = await this.resolveUserIds(user, mostPurchasedItems.userId);

    const result = await this.reportsRepository.mostPurchasedItems(
      userIds,
      mostPurchasedItems.startDate,
      mostPurchasedItems.endDate,
    );

    return result.map(
      (item: MostPurchasedItemsResult) => new MostPurchasedItemsModel(item),
    );
  }

  async expensesIncomeComparison(
    user: User,
    expensesIncomeComparison: ExpensesIncomeComparisonDto,
  ): Promise<ExpensesIncomeComparisonModel[]> {
    const userIds = await this.resolveUserIds(
      user,
      expensesIncomeComparison.userId,
    );

    const year = expensesIncomeComparison.year ?? new Date().getFullYear().toString();

    const start = `${year}-01-01 00:00:00`;
    const end = `${year}-12-31 23:59:59`;

    const [expenses, revenues] = await Promise.all([
      this.reportsRepository.expenseByGroupedMonth(userIds, start, end),
      this.reportsRepository.revenueByGroupedMonth(userIds, start, end),
    ]);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      return `${year}-${month}`;
    });

    return months.map((month) => {
      const exp = expenses.find(
        (e: ExpenseByGroupedMonthResult) => e.month === month,
      );
      const rev = revenues.find(
        (r: RevenueByGroupedMonthResult) => r.month === month,
      );
      return new ExpensesIncomeComparisonModel({
        month,
        totalExpenses: exp ? Number(exp.totalExpenses) : 0,
        totalRevenues: rev ? Number(rev.totalRevenues) : 0,
      });
    });
  }

  async warrantyItems(
    user: User,
    query: WarrantyItemsQueryDto,
  ): Promise<paginationData<WarrantyItemModel>> {
    const userIds = await this.resolveUserIds(user, query.userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const offset = this.pagination.getOffset(page, limit);
    const year = query.year ?? new Date().getFullYear().toString();
    const search = query.search ?? '';
    const includeExpired = query.includeExpired ?? false;

    const [rows, totalItems] = await Promise.all([
      this.reportsRepository.warrantyItems(
        userIds,
        year,
        search,
        includeExpired,
        limit,
        offset,
      ),
      this.reportsRepository.warrantyItemsCount(
        userIds,
        year,
        search,
        includeExpired,
      ),
    ]);

    const data = rows.map((item: WarrantyItemsResult) => {
      const expiresAt = new Date(item.warrantyExpiresAt);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / msPerDay,
      );

      return new WarrantyItemModel({
        ...item,
        daysRemaining,
        isExpired: daysRemaining < 0,
      });
    });

    return this.pagination.paginateData(
      data,
      page,
      limit,
      totalItems,
      `${this.url}/warranty-items`,
    );
  }

  private async resolveUserIds(
    currentUser: User,
    userId?: string,
  ): Promise<string[]> {
    let userIds: string[];

    if (!userId) {
      userIds = await this.familyGroupService.getAcceptedMemberUserIdsIfAdmin(
        currentUser.id,
      );
    } else if (userId === 'all') {
      userIds = await this.familyGroupService.getAcceptedMemberUserIds(
        currentUser.id,
      );
    } else {
      const familyMemberIds =
        await this.familyGroupService.getAcceptedMemberUserIds(currentUser.id);

      if (!familyMemberIds.includes(userId)) {
        throw new ForbiddenException(
          'Você não tem permissão para ver os dados deste usuário.',
        );
      }

      userIds = [userId];
    }

    if (userIds.length === 0) {
      return [currentUser.id];
    }

    return userIds;
  }
}
