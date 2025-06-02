import { Injectable } from '@nestjs/common';
import { IExpenseRepository } from './contracts/expense.repository.interface';
import { Brackets, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseModel } from './model/expense.model';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { UpdateException } from 'src/exception/updateException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(private expenseEntity: Repository<Expense>) {}

  async create(
    userId: string,
    createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseModel> {
    const newExpense = this.expenseEntity.create({
      ...createExpenseDto,
      user: { id: userId },
    });
    const savedExpense = await this.expenseEntity.save(newExpense);
    return new ExpenseModel(savedExpense);
  }

  async findAll(): Promise<ExpenseModel[] | []> {
    const expenses = await this.expenseEntity.find();

    if (expenses) {
      return expenses.map((expense) => new ExpenseModel(expense));
    }

    return [];
  }

  async find(id: string): Promise<ExpenseModel | null> {
    const expense = await this.expenseEntity.findOneBy({ id });

    if (expense) {
      return new ExpenseModel(expense);
    }

    return null;
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseModel> {
    const updateExpense = await this.expenseEntity.findOneBy({ id });

    if (!updateExpense) {
      throw new UpdateException();
    }

    // const existExpense = await this.expenseEntity.findOne({
    //  where: {
    //    name: ILike(),
    //    id: Not(Equal(updateExpense.id)),
    //  },
    // });

    // if (existExpense) {
    //  throw new AlreadyExistsException();
    // } // caso precisa verificar se ja existe com o mesmo nome

    const store = await this.expenseEntity.save({
      ...updateExpense,
      ...updateExpenseDto,
    });

    return new ExpenseModel(store);
  }

  async remove(id: string): Promise<ExpenseModel> {
    const expense = await this.expenseEntity.findOneBy({ id });

    if (expense) {
      throw new RemoveException();
    }

    await this.expenseEntity.remove(expense);
    return new ExpenseModel(expense);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.expenseEntity.softDelete({ id });

    return result.affected === 1;
  }

  async findByPeriodAndRepeat(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ExpenseModel[] | []> {
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('DATE(expense.createdAt) BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          }).orWhere(
            '(expense.repeat = true AND DATE(expense.createdAt) <= :endDate)',
            { endDate },
          );
        }),
      )
      .orderBy('expense.createdAt', 'ASC');

    const expenses = await query.getMany();

    return expenses.length > 0
      ? expenses.map((expense) => new ExpenseModel(expense))
      : [];
  }
}
