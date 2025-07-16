import { Inject, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { getCurrentMonthDates } from 'src/common/utils/dates.util';
import { User } from 'src/user/entities/user.entity';
import { Expense } from './entities/expense.entity';
import { IExpenseRepository } from './interface/expense.repository.interface';
import { ExpenseListDto } from './dto/expense-list.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { ValueExpenseCurrentResponseDto } from './dto/value-expense-current-response.dto';
import { itemType } from './types/itemType';
import {
  logResultsPromises,
  withTimeout,
} from 'src/common/utils/helpPromises.util';
import { PaymentService } from 'src/payment/payment.service';
import { StoreService } from 'src/store/store.service';
import { GroupService } from 'src/group/group.service';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { Item } from './entities/item.entity';
import { CoinService } from 'src/coin/coin.service';
import { coinType } from 'src/coin/types/coinType';
import { UpdateException } from 'src/exception/updateException';
import { UpdateItemDto } from './dto/update-item.dto';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { Group } from 'src/group/entities/group.entity';

@Injectable()
export class ExpenseService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/expense`;
  private defaultPayment = 'Cartão de crédito';
  private defaultGroup = 'Alimentação';

  constructor(
    @Inject('IExpenseRepository')
    private expenseRepository: IExpenseRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private storeService: StoreService,
    private paymentService: PaymentService,
    private groupService: GroupService,
    private coinService: CoinService,
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
      const itens = [] as Item[];

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

        itens.push(savedItem);
      }

      await this.queryRunnerFactory.commitTransaction();

      expense.items = itens;

      const results = await Promise.allSettled([
        withTimeout(this.addCoins(user, 'coupon')),
      ]);

      //Log results promises
      logResultsPromises(results, ['addCoins']);

      return expense;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  private async addCoins(user: User, typeCoins: coinType): Promise<void> {
    await this.coinService.addCoins(user, { type: typeCoins });
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

  async findOrCreateStore(storeName: string): Promise<Store> {
    let updateStore = await this.storeService.findByName(storeName);

    if (!updateStore) {
      const savedStore = await this.storeService.create({
        name: storeName,
      });
      updateStore = savedStore;
    }

    return updateStore;
  }

  async findOrCreatePayment(paymentName: string): Promise<Payment> {
    let updatePayment = await this.paymentService.findByName(paymentName);

    if (!updatePayment) {
      const savedPayment = await this.paymentService.create({
        name: paymentName,
      });
      updatePayment = savedPayment;
    }

    return updatePayment;
  }

  async findOrCreateGroup(groupName: string): Promise<Group> {
    let updateGroup = await this.groupService.findByName(groupName);

    if (!updateGroup) {
      const savedGroup = await this.groupService.create({
        name: groupName,
      });
      updateGroup = savedGroup;
    }

    return updateGroup;
  }

  async update(
    expenseId: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    try {
      await this.queryRunnerFactory.startTransaction();

      const expense = await this.expenseRepository.find(expenseId);

      if (!expense) {
        throw new UpdateException();
      }

      if (updateExpenseDto.store) {
        const updateStore = await this.findOrCreateStore(
          updateExpenseDto.store.name,
        );
        updateExpenseDto.store = updateStore;
      }

      if (updateExpenseDto.payment) {
        const updatePayment = await this.findOrCreatePayment(
          updateExpenseDto.payment.name,
        );
        updateExpenseDto.payment = updatePayment;
      }

      await this.expenseRepository.update(
        expense,
        updateExpenseDto,
        this.queryRunnerFactory.manager,
      );

      // TODO - trocar para updateItem separadamente, para cada item
      // const itens = [] as Item[];

      // if (updateExpenseDto.items && updateExpenseDto.items.length > 0) {
      //   for (const item of updateExpenseDto.items) {
      //     if (item.group) {
      //       let updateGroup = await this.groupService.findByName(
      //         item.group.name,
      //       );

      //       if (!updateGroup) {
      //         const savedGroup = await this.groupService.create(
      //           item.group,
      //           this.queryRunnerFactory.manager,
      //         );
      //         updateGroup = savedGroup;
      //       }
      //       item.group = updateGroup;
      //     }

      //     const updateItem = await this.expenseRepository.findItemById(item.id);

      //     const updatedItem = await this.expenseRepository.UpdateItem(
      //       updateItem,
      //       updatedExpense,
      //       item,
      //       this.queryRunnerFactory.manager,
      //     );

      //     itens.push(updatedItem);
      //   }
      // }

      // updatedExpense.items = itens;

      await this.queryRunnerFactory.commitTransaction();
      return await this.expenseRepository.find(expenseId);
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async updateValueExpense(expenseId: string): Promise<Expense> {
    const allItems = await this.expenseRepository.findAllItemsByExpenseId(
      expenseId,
    );

    const total = this.calculateTotalValue(allItems);

    const expense = await this.expenseRepository.find(expenseId);

    return await this.expenseRepository.update(expense, {
      ...expense,
      value: total,
    });
  }

  async updateItem(
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    try {
      await this.queryRunnerFactory.startTransaction();

      if (updateItemDto.group) {
        const updateGroup = await this.groupService.findByName(
          updateItemDto.group.name,
        );
        updateItemDto.group = updateGroup;
      }

      const updateItem = await this.expenseRepository.findItemById(itemId);

      const updatedItem = await this.expenseRepository.UpdateItem(
        updateItem,
        updateItemDto,
        this.queryRunnerFactory.manager,
      );

      await this.queryRunnerFactory.commitTransaction();

      await this.updateValueExpense(updatedItem.expense.id);

      return updatedItem;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
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
      const itemTotal = !isNaN(item.total) ? Number(item.total) : 0;
      return total + itemTotal;
    }, 0);

    return Number((Math.ceil(total * 100) / 100).toFixed(2));
  };

  async getMostUsedPaymentName(): Promise<string> {
    const paymentName = await this.expenseRepository.getMostUsedPaymentName();

    return paymentName ?? this.defaultPayment;
  }

  async getGroupNameByItemName(itemName: string): Promise<string> {
    let groupName = await this.expenseRepository.getGroupByItemName(itemName);

    if (!groupName) {
      groupName = await this.expenseRepository.getGroupByItemNamePartial(
        itemName,
      );
    }

    return groupName ?? this.defaultGroup;
  }
}
