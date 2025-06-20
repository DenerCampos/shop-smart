import { paginationData } from 'src/common/pagination/pagination';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ExpenseListDto } from '../dto/expense-list.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../entities/expense.entity';
import { User } from 'src/user/entities/user.entity';

export interface IExpenseRepository {
  create(user: User, createExpenseDto: CreateExpenseDto): Promise<Expense>;
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
