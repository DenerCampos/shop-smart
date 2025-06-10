import { Injectable } from '@nestjs/common';
import { IExpenseRepository } from './contracts/expense.repository.interface';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { ExpenseModel } from './model/expense.model';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { UserModel } from 'src/user/model/user.model';
import { GetValueExpenseCurrentDto } from './dto/getValueExpenseCurrent.dto';
import { getCurrentMonthDates } from 'src/common/utils/dates';

@Injectable()
export class ExpenseService {
  private readonly limitDefault = 5;

  constructor(private expenseRepository: IExpenseRepository) {}

  async create(
    user: UserModel,
    createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseModel> {
    return this.expenseRepository.create(user.id, createExpenseDto);
  }

  async findAll(): Promise<ExpenseModel[] | []> {
    return this.expenseRepository.findAll();
  }

  async find(expenseId: string): Promise<ExpenseModel | null> {
    return this.expenseRepository.find(expenseId);
  }

  async update(
    expenseId: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseModel> {
    return this.expenseRepository.update(expenseId, updateExpenseDto);
  }

  async remove(expenseId: string): Promise<ExpenseModel> {
    return this.expenseRepository.remove(expenseId);
  }

  async delete(expenseId: string): Promise<boolean> {
    return this.expenseRepository.delete(expenseId);
  }

  async getAllByCurrentMonth(user: UserModel): Promise<ExpenseModel[] | []> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    return this.expenseRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );
  }

  async getExpenseByCurrentMonth(
    user: UserModel,
  ): Promise<GetValueExpenseCurrentDto> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    const expenses = await this.expenseRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return {
        value: 0,
      };
    }

    let total = 0;
    expenses.forEach((expense: ExpenseModel) => {
      const value = Number(expense.value) || 0;
      total += value;
    });

    return {
      value: Number((Math.ceil(total * 100) / 100).toFixed(2)),
    };
  }

  async getLatest(
    user: UserModel,
    limit = this.limitDefault,
  ): Promise<ExpenseModel[] | []> {
    return this.expenseRepository.getLatest(user.id, limit);
  }
}
