import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  getCurrentDay,
  getCurrentMonthDates,
  getPreviousMonth,
  getPreviousMonthDates,
  setSpecificMonth,
} from 'src/common/utils/dates.util';
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
import { ExpenseRecurringConfirmDto } from './dto/expense-recurring-confirm.dto';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { EntityManager } from 'typeorm';

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
    private readonly familyMemberResolver: FamilyMemberResolverService,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
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
        user,
        this.queryRunnerFactory.manager,
      );

      const savedPayment = await this.paymentService.create(
        payment,
        user,
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
          user,
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

      this.eventEmitter.emit('expense.created', { userId: user.id });

      if (createExpenseDto.uri?.trim()) {
        this.eventEmitter.emit('coupon.processed', { userId: user.id });
      }

      return expense;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  /** Liquidação de mesada — sem moedas nem eventos de missão. */
  async createPayrollExpense(
    user: User,
    params: {
      name: string;
      date: Date;
      items: Array<{ name: string; value: number }>;
    },
    manager: EntityManager,
  ): Promise<Expense> {
    const items: itemType[] = params.items.map((item, index) => ({
      code: `mesada-${index + 1}`,
      name: item.name,
      quantity: 1,
      unit: 'un',
      value: item.value,
      total: item.value,
      group: { name: 'Mesada' },
    }));

    const value = items.reduce((sum, item) => sum + item.total, 0);

    const savedStore = await this.storeService.create(
      { name: 'Mesada' },
      user,
      manager,
    );

    const savedPayment = await this.paymentService.create(
      { name: 'Dinheiro' },
      user,
      manager,
    );

    const expense = await this.expenseRepository.create(
      user,
      savedStore,
      savedPayment,
      {
        name: params.name,
        value,
        repeat: false,
        uri: '',
        date: params.date,
      },
      manager,
    );

    for (const item of items) {
      const { group, ...itemData } = item;
      const savedGroup = await this.groupService.create(group, user, manager);
      await this.expenseRepository.createItem(
        expense,
        savedGroup,
        itemData,
        manager,
      );
    }

    return expense;
  }

  private async addCoins(user: User, typeCoins: coinType): Promise<void> {
    await this.coinService.addCoins(user, { type: typeCoins });
  }

  async findAll(
    expenseList: ExpenseListDto,
    user: User,
  ): Promise<paginationData<Expense>> {
    const offset = this.pagination.getOffset(
      expenseList.page,
      expenseList.limit,
    );

    const { userIds } = await this.familyMemberResolver.resolve(user.id);

    const [expenses, total] = await this.expenseRepository.findAll(
      userIds,
      offset,
      expenseList.limit,
      expenseList.search,
      expenseList.isRecurring,
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

  async findOrCreateStore(storeName: string, user: User): Promise<Store> {
    let updateStore = await this.storeService.findByName(storeName, user);

    if (!updateStore) {
      const savedStore = await this.storeService.create(
        {
          name: storeName,
        },
        user,
      );
      updateStore = savedStore;
    }

    return updateStore;
  }

  async findOrCreatePayment(paymentName: string, user: User): Promise<Payment> {
    let updatePayment = await this.paymentService.findByName(paymentName, user);

    if (!updatePayment) {
      const savedPayment = await this.paymentService.create(
        {
          name: paymentName,
        },
        user,
      );
      updatePayment = savedPayment;
    }

    return updatePayment;
  }

  async findOrCreateGroup(groupName: string, user: User): Promise<Group> {
    let updateGroup = await this.groupService.findByName(groupName, user);

    if (!updateGroup) {
      const savedGroup = await this.groupService.create(
        {
          name: groupName,
        },
        user,
      );
      updateGroup = savedGroup;
    }

    return updateGroup;
  }

  private async removeItems(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;

    await this.expenseRepository.removeItems(
      itemIds,
      this.queryRunnerFactory.manager,
    );
  }

  async update(
    expenseId: string,
    updateExpenseDto: UpdateExpenseDto,
    user: User,
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
          user,
        );
        updateExpenseDto.store = updateStore;
      }

      if (updateExpenseDto.payment) {
        const updatePayment = await this.findOrCreatePayment(
          updateExpenseDto.payment.name,
          user,
        );
        updateExpenseDto.payment = updatePayment;
      }

      // Remover os items do DTO antes de atualizar a expense
      const {
        items: itemsToUpdate,
        removedItemIds,
        ...expenseData
      } = updateExpenseDto;

      // Atualizar apenas os dados da expense, sem mexer nos items
      const expenseToUpdate = {
        ...expenseData,
        items: expense.items, // Mantém os items existentes
      };

      await this.expenseRepository.update(
        expense,
        expenseToUpdate,
        this.queryRunnerFactory.manager,
      );

      // Remover itens que foram marcados para remoção
      if (removedItemIds && removedItemIds.length > 0) {
        await this.removeItems(removedItemIds);
      }

      // Atualizar ou criar novos itens
      if (itemsToUpdate && itemsToUpdate.length > 0) {
        for (const item of itemsToUpdate) {
          if (item.group) {
            let updateGroup = await this.groupService.findByName(
              item.group.name,
              user,
            );

            if (!updateGroup) {
              const savedGroup = await this.groupService.create(
                item.group,
                user,
                this.queryRunnerFactory.manager,
              );
              updateGroup = savedGroup;
            }
            item.group = updateGroup;
          }

          if (!item.id || item.id === '') {
            const { id, ...itemWithoutId } = item;
            const savedItem = await this.expenseRepository.createItem(
              expense,
              item.group as Group,
              itemWithoutId,
              this.queryRunnerFactory.manager,
            );
          } else {
            const updateItem = await this.expenseRepository.findItemById(
              item.id,
            );

            if (!updateItem) {
              throw new UpdateException();
            }

            // Extrair apenas as propriedades que queremos atualizar
            const { code, name, quantity, unit, value, total } = item;
            await this.expenseRepository.UpdateItem(
              updateItem,
              { code, name, quantity, unit, value, total },
              this.queryRunnerFactory.manager,
            );
          }
        }
      }

      await this.queryRunnerFactory.commitTransaction();
      return await this.expenseRepository.find(expenseId);
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async updateValueExpense(expenseId: string): Promise<Expense> {
    const allItems =
      await this.expenseRepository.findAllItemsByExpenseId(expenseId);

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
    user: User,
  ): Promise<Item> {
    try {
      await this.queryRunnerFactory.startTransaction();

      if (updateItemDto.group) {
        const updateGroup = await this.groupService.findByName(
          updateItemDto.group.name,
          user,
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

  async getByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[]> {
    return this.expenseRepository.findByPeriod(userId, startDate, endDate);
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
    return this.sumExpensesByPeriod(user.id, startDateString, endDateString);
  }

  async getExpenseByPreviousMonth(
    user: User,
  ): Promise<ValueExpenseCurrentResponseDto> {
    const { startDateString, endDateString } = getPreviousMonthDates();
    return this.sumExpensesByPeriod(user.id, startDateString, endDateString);
  }

  private async sumExpensesByPeriod(
    userId: string,
    startDateString: string,
    endDateString: string,
  ): Promise<ValueExpenseCurrentResponseDto> {
    const expenses = await this.expenseRepository.findByPeriod(
      userId,
      startDateString,
      endDateString,
    );

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return { value: 0 };
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
    userIds: string[],
    limit = this.limitDefault,
  ): Promise<Expense[] | []> {
    return this.expenseRepository.getLatest(userIds, limit);
  }

  async countByUser(userIds: string[]): Promise<number> {
    return this.expenseRepository.countByUser(userIds);
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
      groupName =
        await this.expenseRepository.getGroupByItemNamePartial(itemName);
    }

    return groupName ?? this.defaultGroup;
  }

  async getRecurringExpenseByCurrentMonth(user: User): Promise<Expense[] | []> {
    const month = getPreviousMonth();
    const day = getCurrentDay();

    return this.expenseRepository.findRecurringByMonthAndDay(
      user.id,
      month,
      day,
    );
  }

  async updateRecurringExpenseToFalse(expenseId: string): Promise<void> {
    const expense = await this.expenseRepository.find(expenseId);
    await this.expenseRepository.update(expense, {
      ...expense,
      repeat: false,
    });
  }

  async recurringConfirm(
    user: User,
    expenseRecurringConfirmDto: ExpenseRecurringConfirmDto,
  ): Promise<void> {
    const { expenses } = expenseRecurringConfirmDto;
    const { expenseIds } = expenseRecurringConfirmDto;

    // trocar para false a repetição de cada despesa do array expenseIds
    expenseIds.forEach(async (expenseId: string) => {
      await this.updateRecurringExpenseToFalse(expenseId);
    });

    // criar as novas despesas, executado assim para não usar muitas conexões com o banco de dados (limit de 2)
    for (const expense of expenses) {
      const currentMonth = new Date().getMonth() + 1;
      expense.date = setSpecificMonth(expense.date, currentMonth);
      await this.create(user, expense);
    }
  }

  async hasRecurringPreviousMonth(user: User): Promise<boolean> {
    const expenses = await this.expenseRepository.findRecurringByMonthAndDay(
      user.id,
      getPreviousMonth(),
      getCurrentDay(),
    );

    return expenses.length > 0;
  }
}
