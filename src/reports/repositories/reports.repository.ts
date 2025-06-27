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
    userId: string,
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
      .andWhere('expense.userId = :userId', { userId })
      .groupBy('group.id')
      .orderBy('value', 'DESC')
      .getRawMany();

    return result;
  }

  async expenseByStore(
    userId: string,
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
      .andWhere('expense.userId = :userId', { userId })
      .groupBy('store.id')
      .orderBy('value', 'DESC')
      .getRawMany();

    return result;
  }

  async expenseByDate(
    userId: string,
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
      .andWhere('expense.userId = :userId', { userId })
      .groupBy('expense.date')
      .orderBy('expense.date', 'ASC')
      .getRawMany();

    return result;
  }

  async expenseByMonth(
    userId: string,
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
      .andWhere('expense.userId = :userId', { userId })
      .groupBy('expense.date')
      .orderBy('expense.date', 'ASC')
      .getRawMany();

    return result;
  }

  async mostPurchasedItems(
    userId: string,
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
      .andWhere('expense.userId = :userId', { userId })
      .groupBy('item.name')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    return result;
  }

  async expenseByGroupedMonth(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseByGroupedMonthResult[] | []> {
    const result = await this.expenseEntity
      .createQueryBuilder('expense')
      .select("DATE_FORMAT(expense.date, '%Y-%m')", 'month')
      .addSelect('SUM(expense.value)', 'totalExpenses')
      .where('expense.userId = :userId', { userId })
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
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<RevenueByGroupedMonthResult[] | []> {
    const result = await this.revenueEntity
      .createQueryBuilder('revenue')
      .select("DATE_FORMAT(revenue.createdAt, '%Y-%m')", 'month')
      .addSelect('SUM(revenue.value)', 'totalRevenues')
      .where('revenue.userId = :userId', { userId })
      .andWhere('revenue.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('month')
      .getRawMany();

    return result;
  }
}
