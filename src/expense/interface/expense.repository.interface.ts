import { EntityManager } from 'typeorm';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../entities/expense.entity';
import { User } from 'src/user/entities/user.entity';
import { Item } from '../entities/item.entity';
import { Group } from 'src/group/entities/group.entity';
import { CreateExpenseEntityDto } from '../dto/create-expense-entity.dto';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { CreateItemEntityDto } from '../dto/create-item-entity.dto';
import { UpdateItemEntityDto } from '../dto/update-item-entity.dto';

export interface IExpenseRepository {
  create(
    user: User,
    store: Store,
    payment: Payment,
    createExpenseDto: CreateExpenseEntityDto,
    manager?: EntityManager,
  ): Promise<Expense>;
  createItem(
    expense: Expense,
    group: Group,
    CreateItemDto: CreateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item>;
  findAll(
    userIds: string[],
    page: number,
    limit: number,
    search?: string,
    isRecurring?: boolean,
  ): Promise<[Expense[], number]>;
  find(id: string): Promise<Expense | null>;
  update(
    expense: Expense,
    updateExpense: UpdateExpenseDto,
    manager?: EntityManager,
  ): Promise<Expense>;
  UpdateItem(
    item: Item,
    updateItemDto: UpdateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item>;
  remove(id: string): Promise<Expense>;
  delete(id: string): Promise<boolean>;
  findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[] | []>;
  findByMonth(userId: string, month: number): Promise<Expense[] | []>;
  exist(userId: string): Promise<boolean>;
  getLatest(userIds: string[], limit: number): Promise<Expense[] | []>;
  countAll(): Promise<number>;
  countByUser(userIds: string[]): Promise<number>;
  findItemById(id: string): Promise<Item | null>;
  findAllItemsByExpenseId(expenseId: string): Promise<Item[]>;
  getMostUsedPaymentName(): Promise<string | null>;
  getGroupByItemName(itemName: string): Promise<string | null>;
  getGroupByItemNamePartial(itemName: string): Promise<string | null>;
  findRecurringByMonthAndDay(
    userId: string,
    month: number,
    day: number,
  ): Promise<Expense[] | []>;
  removeItem(id: string): Promise<void>;
  removeItems(itemIds: string[], manager?: EntityManager): Promise<void>;
}
