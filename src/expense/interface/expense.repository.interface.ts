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
  findAll(page: number, limit: number): Promise<[Expense[], number]>;
  find(id: string): Promise<Expense | null>;
  update(id: string, updateExpense: UpdateExpenseDto): Promise<Expense>;
  remove(id: string): Promise<Expense>;
  delete(id: string): Promise<boolean>;
  findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[] | []>;
  findByMonth(userId: string, month: number): Promise<Expense[] | []>;
  exist(): Promise<boolean>;
  getLatest(userId: string, limit: number): Promise<Expense[] | []>;
  countAll(): Promise<number>;
}
