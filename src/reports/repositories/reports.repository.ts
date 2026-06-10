import { Injectable } from '@nestjs/common';
import { IReportsRepository } from '../interfaces/reports.repository.interface';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/expense/entities/item.entity';
import {
  ExpenseByDateResult,
  ExpenseByGroupedMonthResult,
  ExpenseByGroupResult,
  ExpenseByStoreResult,
  MostPurchasedItemsResult,
  RevenueByGroupedMonthResult,
  WarrantyItemsResult,
} from '../types/reportsType';
import { Expense } from 'src/expense/entities/expense.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';

@Injectable()
export class ReportsRepository implements IReportsRepository {
  constructor(
    @InjectRepository(Item)
    private itemEntity: Repository<Item>,
    @InjectRepository(Expense)
    private expenseEntity: Repository<Expense>,
    @InjectRepository(Revenue)
    private revenueEntity: Repository<Revenue>,
  ) {}

  async expenseByGroup(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupResult[]> {
    const result = await this.itemEntity
      .createQueryBuilder('item')
      .select('group.name', 'name')
      .addSelect('SUM(item.total)', 'value')
      .innerJoin('item.group', 'group')
      .innerJoin('item.expense', 'expense')
      .where('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('expense.userId IN (:...userIds)', { userIds })
      .groupBy('group.id')
      .orderBy('value', 'DESC')
      .getRawMany();

    return result;
  }

  async expenseByStore(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByStoreResult[] | []> {
    const result = await this.expenseEntity
      .createQueryBuilder('expense')
      .select('store.name', 'name')
      .addSelect('SUM(expense.value)', 'value')
      .innerJoin('expense.store', 'store')
      .where('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('expense.userId IN (:...userIds)', { userIds })
      .groupBy('store.id')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    return result;
  }

  async expenseByDate(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByDateResult[] | []> {
    const result = await this.expenseEntity
      .createQueryBuilder('expense')
      .select('expense.date', 'date')
      .addSelect('SUM(expense.value)', 'value')
      .where('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('expense.userId IN (:...userIds)', { userIds })
      .groupBy('expense.date')
      .orderBy('expense.date', 'ASC')
      .getRawMany();

    return result;
  }

  async mostPurchasedItems(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<MostPurchasedItemsResult[] | []> {
    const result = await this.itemEntity
      .createQueryBuilder('item')
      .select('item.name', 'name')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.total)', 'value')
      .innerJoin('item.expense', 'expense')
      .where('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('expense.userId IN (:...userIds)', { userIds })
      .groupBy('item.name')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    return result;
  }

  async expenseByGroupedMonth(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupedMonthResult[] | []> {
    const result = await this.expenseEntity
      .createQueryBuilder('expense')
      .select("DATE_FORMAT(expense.date, '%Y-%m')", 'month')
      .addSelect('SUM(expense.value)', 'totalExpenses')
      .where('expense.userId IN (:...userIds)', { userIds })
      .andWhere('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }

  async revenueByGroupedMonth(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<RevenueByGroupedMonthResult[] | []> {
    const result = await this.revenueEntity
      .createQueryBuilder('revenue')
      .select("DATE_FORMAT(revenue.date, '%Y-%m')", 'month')
      .addSelect('SUM(revenue.value)', 'totalRevenues')
      .where('revenue.userId IN (:...userIds)', { userIds })
      .andWhere('revenue.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }

  private applyWarrantyItemsFilters(
    qb: SelectQueryBuilder<Item>,
    userIds: string[],
    year: string,
    search: string,
    includeExpired: boolean,
  ) {
    qb.innerJoin('item.expense', 'expense')
      .leftJoin('expense.store', 'store')
      .innerJoin('expense.user', 'user')
      .where('expense.userId IN (:...userIds)', { userIds })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('item.warrantyExpiresAt IS NOT NULL')
      .andWhere('item.warrantyDuration IS NOT NULL')
      .andWhere('YEAR(expense.date) = :year', { year: parseInt(year, 10) })
      .andWhere(
        '(expense.isInstallment = false OR expense.installmentNumber = 1 OR expense.installmentNumber IS NULL)',
      );

    if (!includeExpired) {
      qb.andWhere('item.warrantyExpiresAt >= :now', { now: new Date() });
    }

    if (search) {
      qb.andWhere('LOWER(item.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    return qb;
  }

  async warrantyItems(
    userIds: string[],
    year: string,
    search: string,
    includeExpired: boolean,
    limit: number,
    offset: number,
  ): Promise<WarrantyItemsResult[]> {
    const qb = this.itemEntity.createQueryBuilder('item');
    this.applyWarrantyItemsFilters(qb, userIds, year, search, includeExpired);

    const rows = await qb
      .select('item.id', 'id')
      .addSelect('item.name', 'name')
      .addSelect('item.quantity', 'quantity')
      .addSelect('item.warrantyDuration', 'warrantyDuration')
      .addSelect('item.warrantyUnit', 'warrantyUnit')
      .addSelect('item.warrantyExpiresAt', 'warrantyExpiresAt')
      .addSelect('expense.date', 'purchaseDate')
      .addSelect('expense.id', 'expenseId')
      .addSelect('expense.name', 'expenseName')
      .addSelect('store.name', 'storeName')
      .addSelect('user.id', 'userId')
      .addSelect('user.name', 'userName')
      .orderBy('item.warrantyExpiresAt', 'ASC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: Number(row.quantity),
      warrantyDuration: Number(row.warrantyDuration),
      warrantyUnit: row.warrantyUnit,
      warrantyExpiresAt: row.warrantyExpiresAt,
      purchaseDate: row.purchaseDate,
      expenseId: row.expenseId,
      expenseName: row.expenseName,
      storeName: row.storeName ?? null,
      userId: row.userId,
      userName: row.userName,
    }));
  }

  async warrantyItemsCount(
    userIds: string[],
    year: string,
    search: string,
    includeExpired: boolean,
  ): Promise<number> {
    const qb = this.itemEntity.createQueryBuilder('item');
    this.applyWarrantyItemsFilters(qb, userIds, year, search, includeExpired);

    const result = await qb
      .select('COUNT(DISTINCT item.id)', 'total')
      .getRawOne();
    return Number(result?.total ?? 0);
  }
}
