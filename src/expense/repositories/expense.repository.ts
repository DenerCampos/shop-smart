import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { RemoveException } from 'src/exception/removeException';
import { IExpenseRepository } from '../interface/expense.repository.interface';
import { Expense } from '../entities/expense.entity';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { User } from 'src/user/entities/user.entity';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(
    @InjectRepository(Expense)
    private expenseEntity: Repository<Expense>,
  ) {}

  async create(
    user: User,
    createExpenseDto: CreateExpenseDto,
  ): Promise<Expense> {
    const newExpense = this.expenseEntity.create({
      ...createExpenseDto,
      user,
    });

    return await this.expenseEntity.save(newExpense);
  }

  async findAll(page: number, limit: number): Promise<[Expense[], number]> {
    const queryBuilder = this.expenseEntity.createQueryBuilder('expense');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async countAll(): Promise<number> {
    return await this.expenseEntity.count({
      withDeleted: false,
    });
  }

  async find(id: string): Promise<Expense | null> {
    return await this.expenseEntity.findOneBy({ id });
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
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

    return await this.expenseEntity.save({
      ...updateExpense,
      ...updateExpenseDto,
    });
  }

  async remove(id: string): Promise<Expense> {
    const expense = await this.expenseEntity.findOneBy({ id });

    if (expense) {
      throw new RemoveException();
    }

    await this.expenseEntity.remove(expense);
    return expense;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.expenseEntity.softDelete({ id });

    return result.affected === 1;
  }

  async findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[] | []> {
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('DATE(expense.createdAt) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('expense.createdAt', 'ASC');

    return await query.getMany();
  }

  async findByMonth(userId: string, month: number): Promise<Expense[] | []> {
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('expense.repeat = true')
      .andWhere('EXTRACT(MONTH FROM expense.createdAt) = :month', { month })
      .orderBy('expense.createdAt', 'ASC');

    return await query.getMany();
  }

  async exist(): Promise<boolean> {
    const hasData = await this.expenseEntity
      .createQueryBuilder('expense')
      .limit(1)
      .getOne();

    return hasData !== null;
  }

  async getLatest(userId: string, limit: number): Promise<Expense[] | []> {
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .limit(limit)
      .orderBy('expense.createdAt', 'DESC');

    return await query.getMany();
  }
}
