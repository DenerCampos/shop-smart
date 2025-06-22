import { Inject, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { getCurrentMonthDates } from 'src/common/utils/dates';
import { User } from 'src/user/entities/user.entity';
import { Expense } from './entities/expense.entity';
import { IExpenseRepository } from './interface/expense.repository.interface';
import { ExpenseListDto } from './dto/expense-list.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { ValueExpenseCurrentResponseDto } from './dto/value-expense-current-response.dto';
import { itemType } from './types/itemType';
import { logResultsPromises, withTimeout } from 'src/common/utils/helpPromises';
import { PaymentService } from 'src/payment/payment.service';
import { StoreService } from 'src/store/store.service';
import { GroupService } from 'src/group/group.service';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';

@Injectable()
export class ExpenseService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/expense`;

  constructor(
    @Inject('IExpenseRepository')
    private expenseRepository: IExpenseRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private storeService: StoreService,
    private paymentService: PaymentService,
    private groupService: GroupService,
    private queryRunnerFactory: QueryRunnerFactory,
  ) {}

  async create(
    user: User,
    createExpenseDto: CreateExpenseDto,
  ): Promise<Expense> {
    await this.queryRunnerFactory.startTransaction();

    try {
      createExpenseDto.value = this.calculateTotalValue(createExpenseDto.items);

      const { items, store, payment, ...expenseData } = createExpenseDto;

      const savedStore = await this.storeService.create(
        store,
        this.queryRunnerFactory.manager,
      );

      const savedPayment = await this.paymentService.create(
        payment,
        this.queryRunnerFactory.manager,
      );

      const expense = await this.expenseRepository.create(
        user,
        savedStore,
        savedPayment,
        {
          ...expenseData,
        },
        this.queryRunnerFactory.manager,
      );

      for (const item of items) {
        const { group, ...itemData } = item;

        const savedGroup = await this.groupService.create(
          group,
          this.queryRunnerFactory.manager,
        );
        const savedItem = await this.expenseRepository.createItem(
          expense,
          savedGroup,
          {
            ...itemData,
          },
          this.queryRunnerFactory.manager,
        );
      }

      await this.queryRunnerFactory.commitTransaction();

      // const results = await Promise.allSettled([
      //   withTimeout(this.addCoins(user, 'coupon')),
      //   withTimeout(this.addExpenses(user, coupon)),
      // ]);

      // //Log results promises
      // logResultsPromises(results, ['addCoins', 'addExpenses']);

      console.log('Expense created:', expense);

      return expense;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async findAll(expenseList: ExpenseListDto): Promise<paginationData<Expense>> {
    const offset = this.pagination.getOffset(
      expenseList.page,
      expenseList.limit,
    );

    const [expenses, total] = await this.expenseRepository.findAll(
      offset,
      expenseList.limit,
    );

    const paginateData = this.pagination.paginateData<Expense>(
      expenses,
      expenseList.page,
      expenseList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(expenseId: string): Promise<Expense | null> {
    return this.expenseRepository.find(expenseId);
  }

  async update(
    expenseId: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expenseRepository.update(expenseId, updateExpenseDto);
  }

  async remove(expenseId: string): Promise<Expense> {
    return this.expenseRepository.remove(expenseId);
  }

  async delete(expenseId: string): Promise<boolean> {
    return this.expenseRepository.delete(expenseId);
  }

  async getAllByCurrentMonth(user: User): Promise<Expense[] | []> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    return this.expenseRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );
  }

  async getExpenseByCurrentMonth(
    user: User,
  ): Promise<ValueExpenseCurrentResponseDto> {
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
    expenses.forEach((expense: Expense) => {
      const value = Number(expense.value) || 0;
      total += value;
    });

    return {
      value: Number((Math.ceil(total * 100) / 100).toFixed(2)),
    };
  }

  async getLatest(
    user: User,
    limit = this.limitDefault,
  ): Promise<Expense[] | []> {
    return this.expenseRepository.getLatest(user.id, limit);
  }

  private calculateTotalValue = (items: itemType[]): number => {
    if (!items || items.length === 0) return 0;

    const total = items.reduce((total, item) => {
      const itemTotal =
        typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
      return total + itemTotal;
    }, 0);

    return Number((Math.ceil(total * 100) / 100).toFixed(2));
  };
}
