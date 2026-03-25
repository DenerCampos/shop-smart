import { Injectable } from '@nestjs/common';
import { IReportsRepository } from '../interfaces/reports.repository.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/expense/entities/item.entity';
import {
  ExpenseByDateResult,
  ExpenseByGroupedMonthResult,
  ExpenseByGroupResult,
  ExpenseByStoreResult,
  MostPurchasedItemsResult,
  RevenueByGroupedMonthResult,
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
      .select("DATE_FORMAT(revenue.createdAt, '%Y-%m')", 'month')
      .addSelect('SUM(revenue.value)', 'totalRevenues')
      .where('revenue.userId IN (:...userIds)', { userIds })
      .andWhere('revenue.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('month')
      .getRawMany();

    return result;
  }
}
