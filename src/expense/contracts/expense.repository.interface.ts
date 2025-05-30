import { CreateExpenseDto } from '../dto/createExpense.dto';
import { UpdateExpenseDto } from '../dto/updateExpense.dto';
import { ExpenseModel } from '../model/expense.model';

export interface IExpenseRepository {
  create(
    userId: string,
    createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseModel>;
  findAll(): Promise<ExpenseModel[] | []>;
  find(id: string): Promise<ExpenseModel | null>;
  update(id: string, updateExpense: UpdateExpenseDto): Promise<ExpenseModel>;
  remove(id: string): Promise<ExpenseModel>;
  delete(id: string): Promise<boolean>;
  findByPeriodAndRepeat(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseModel[] | []>;
}
