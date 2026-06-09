import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { randomUUID } from 'node:crypto';
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
import { InstallmentPlannerService } from 'src/common/installment/installment-planner.service';
import {
  buildInstallmentLabel,
  buildRecurrenceResponseFromExpense,
  computeReceiptAmounts,
  MAX_PHOTOS_PER_FINANCIAL,
  toInstallmentCalendarDate,
} from 'src/common/installment/installment.util';
import { FILE_STORAGE } from 'src/file-storage/file-storage.constants';
import { IFileStorageService } from 'src/file-storage/interfaces/file-storage.interface';
import { NotExistException } from 'src/exception/notExistException';
import { ExpenseReceiptDto } from 'src/common/dto/financial-receipt.dto';
import type { ResolvedInstallmentMeta } from 'src/common/installment/installment-planner.service';
import type { RecurrenceConfigDto } from 'src/common/installment/installment.types';

@Injectable()
export class ExpenseService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/expense`;
  private defaultPayment = 'Cartão de crédito';
  private defaultGroup = 'Alimentação';
  private readonly imageMimeRegex = /^image\/(jpg|jpeg|png|gif|webp)$/;

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
    private readonly installmentPlanner: InstallmentPlannerService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorageService,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
  ) {}

  async create(
    user: User,
    createExpenseDto: CreateExpenseDto,
  ): Promise<Expense> {
    if (
      this.installmentPlanner.isFiniteInstallment(createExpenseDto.recurrence)
    ) {
      return this.createFiniteInstallmentExpenses(user, createExpenseDto);
    }
    return this.createSingleExpenseRecord(user, createExpenseDto, 1);
  }

  private async createFiniteInstallmentExpenses(
    user: User,
    dto: CreateExpenseDto,
  ): Promise<Expense> {
    const totalValue = this.calculateTotalValue(dto.items);
    const schedule = this.installmentPlanner.buildFiniteSchedule(
      toInstallmentCalendarDate(new Date(dto.date)),
      totalValue,
      dto.recurrence!,
    );
    const groupId = randomUUID();
    let firstExpense: Expense | null = null;

    await this.queryRunnerFactory.startTransaction();
    try {
      for (const slice of schedule) {
        const meta: ResolvedInstallmentMeta = {
          installmentGroupId: groupId,
          installmentNumber: slice.installmentNumber,
          totalInstallments: dto.recurrence!.count ?? schedule.length,
          isInstallment: true,
          repeat: false,
        };
        const expense = await this.persistExpense(
          user,
          {
            ...dto,
            value: slice.value,
            date: slice.date,
            items: slice.installmentNumber === 1 ? dto.items : [],
          },
          meta,
          slice.installmentNumber === 1,
        );
        if (slice.installmentNumber === 1) firstExpense = expense;
      }
      await this.queryRunnerFactory.commitTransaction();
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw error;
    }

    if (!firstExpense) throw new Error('Falha ao criar parcelas');
    await this.afterExpenseCreated(user, firstExpense, dto.uri);
    return firstExpense;
  }

  private async createSingleExpenseRecord(
    user: User,
    dto: CreateExpenseDto,
    installmentNumber: number,
  ): Promise<Expense> {
    const meta = this.installmentPlanner.resolveMeta(
      dto.recurrence,
      dto.repeat,
      installmentNumber,
    );
    const value = this.calculateTotalValue(dto.items);

    await this.queryRunnerFactory.startTransaction();
    let expense: Expense;
    try {
      expense = await this.persistExpense(user, { ...dto, value }, meta, true);
      await this.queryRunnerFactory.commitTransaction();
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw error;
    }

    await this.afterExpenseCreated(user, expense, dto.uri);
    return expense;
  }

  private async persistExpense(
    user: User,
    dto: CreateExpenseDto & { value?: number; date?: Date },
    meta: ResolvedInstallmentMeta,
    withItems: boolean,
  ): Promise<Expense> {
    const { items, store, payment, recurrence, ...rest } = dto;
    const normalizedItems = (items ?? []).map((item) =>
      this.normalizeItemLine(item),
    );
    const resolvedValue =
      dto.value ?? this.calculateTotalValue(normalizedItems);
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

    const expensePayload = this.installmentPlanner.mergeInstallmentFields(
      {
        ...rest,
        name: dto.name,
        value: resolvedValue,
        uri: dto.uri ?? '',
        date: dto.date ?? new Date(),
      },
      meta,
      [],
    );

    const expense = await this.expenseRepository.create(
      user,
      savedStore,
      savedPayment,
      expensePayload as never,
      this.queryRunnerFactory.manager,
    );

    if (withItems && normalizedItems.length) {
      const baseDate = new Date(dto.date ?? new Date());
      for (const item of normalizedItems) {
        const { group, ...itemData } = item;
        const savedGroup = await this.groupService.create(
          group,
          user,
          this.queryRunnerFactory.manager,
        );
        const itemEntity = {
          ...itemData,
          ...this.installmentPlanner.normalizeItemWarranty(itemData, baseDate),
        } as Item;
        await this.expenseRepository.createItem(
          expense,
          savedGroup,
          itemEntity as never,
          this.queryRunnerFactory.manager,
        );
      }
    }

    return expense;
  }

  private async afterExpenseCreated(
    user: User,
    expense: Expense,
    uri?: string,
  ): Promise<void> {
    const results = await Promise.allSettled([
      withTimeout(this.addCoins(user, 'coupon')),
    ]);
    logResultsPromises(results, ['addCoins']);
    this.eventEmitter.emit('expense.created', { userId: user.id });
    if (uri?.trim()) {
      this.eventEmitter.emit('coupon.processed', { userId: user.id });
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
      expenseList.isInstallment,
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

  async findForEdit(expenseId: string): Promise<Expense | null> {
    const expense = await this.expenseRepository.find(expenseId);
    if (!expense) return null;

    if (
      expense.installmentGroupId &&
      expense.installmentNumber !== 1 &&
      expense.isInstallment
    ) {
      const root = await this.expenseRepository.findInstallmentRoot(
        expense.installmentGroupId,
      );
      if (root) {
        expense.items = root.items ?? [];
        expense.photos = root.photos ?? [];
      }
    }

    return expense;
  }

  async mapForResponse(expense: Expense): Promise<
    Expense & {
      installmentLabel: string | null;
      recurrence: ReturnType<typeof buildRecurrenceResponseFromExpense>;
    }
  > {
    let groupMembers: Expense[] = [];
    if (expense.installmentGroupId) {
      groupMembers = await this.expenseRepository.findByInstallmentGroup(
        expense.installmentGroupId,
      );
    }

    return {
      ...expense,
      installmentLabel: buildInstallmentLabel(
        expense.installmentNumber,
        expense.totalInstallments,
      ),
      recurrence: buildRecurrenceResponseFromExpense(expense, groupMembers),
    };
  }

  mapSummaryForResponse(expense: Expense): Expense & {
    installmentLabel: string | null;
  } {
    return {
      ...expense,
      installmentLabel: buildInstallmentLabel(
        expense.installmentNumber,
        expense.totalInstallments,
      ),
    };
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
      const manager = this.queryRunnerFactory.manager;

      const expense = await this.expenseRepository.find(expenseId);
      if (!expense) {
        throw new UpdateException();
      }

      const root = await this.resolveInstallmentRoot(expense);

      if (updateExpenseDto.store) {
        updateExpenseDto.store = await this.findOrCreateStore(
          updateExpenseDto.store.name,
          user,
        );
      }

      if (updateExpenseDto.payment) {
        updateExpenseDto.payment = await this.findOrCreatePayment(
          updateExpenseDto.payment.name,
          user,
        );
      }

      const {
        items: itemsToUpdate,
        removedItemIds,
        recurrence,
        id: _dtoId,
        ...rawExpenseFields
      } = updateExpenseDto;

      const totalValue = itemsToUpdate?.length
        ? this.calculateTotalValue(itemsToUpdate)
        : await this.resolveGroupTotalValue(root);

      const meta = this.installmentPlanner.resolveMetaForUpdate(
        recurrence,
        rawExpenseFields.repeat ?? root.repeat,
        root,
        root.installmentNumber ?? 1,
      );

      const editingInstallmentNumber = expense.installmentNumber ?? 1;

      const sharedFields = {
        name: rawExpenseFields.name ?? root.name,
        uri: rawExpenseFields.uri ?? root.uri,
        date: rawExpenseFields.date ?? root.date,
        store: (updateExpenseDto.store ?? root.store) as Store,
        payment: (updateExpenseDto.payment ?? root.payment) as Payment,
      };

      if (this.installmentPlanner.isFiniteInstallment(recurrence)) {
        await this.syncFiniteInstallmentGroupOnUpdate(
          root,
          editingInstallmentNumber,
          user,
          sharedFields,
          totalValue,
          recurrence!,
          manager,
        );
      } else {
        const installmentPayload =
          this.installmentPlanner.mergeInstallmentFields(
            {},
            meta,
            root.photos ?? [],
          );

        await this.expenseRepository.update(
          root,
          {
            ...root,
            ...rawExpenseFields,
            ...sharedFields,
            ...installmentPayload,
            value: itemsToUpdate?.length ? totalValue : root.value,
          },
          manager,
        );

        if (
          root.installmentGroupId &&
          recurrence?.enabled &&
          recurrence.mode === 'installment_infinite'
        ) {
          await this.syncInstallmentMetaOnGroup(
            root.installmentGroupId,
            meta,
            manager,
          );
        }

        if (
          root.installmentGroupId &&
          (!recurrence?.enabled || recurrence.mode === 'none') &&
          !rawExpenseFields.repeat
        ) {
          await this.removeExtraInstallmentMembers(root, manager);
        }
      }

      if (removedItemIds?.length) {
        await this.removeItems(removedItemIds);
      }

      if (itemsToUpdate?.length) {
        await this.upsertExpenseItems(
          root,
          itemsToUpdate,
          new Date(sharedFields.date),
          user,
          manager,
        );
      }

      await this.queryRunnerFactory.commitTransaction();
      const updated = await this.findForEdit(expenseId);
      if (!updated) throw new UpdateException();
      return updated;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw error;
    }
  }

  private async resolveGroupTotalValue(root: Expense): Promise<number> {
    const items = root.items ?? [];
    if (items.length > 0) {
      return this.calculateTotalValue(items as itemType[]);
    }

    if (root.installmentGroupId && root.isInstallment) {
      const members = await this.expenseRepository.findByInstallmentGroup(
        root.installmentGroupId,
      );
      if (members.length > 0) {
        return Number(
          members
            .reduce((sum, member) => sum + Number(member.value), 0)
            .toFixed(2),
        );
      }
    }

    return Number(root.value);
  }

  private async resolveInstallmentRoot(expense: Expense): Promise<Expense> {
    if (expense.installmentGroupId && expense.installmentNumber !== 1) {
      const root = await this.expenseRepository.findInstallmentRoot(
        expense.installmentGroupId,
      );
      return root ?? expense;
    }
    return expense;
  }

  private async syncFiniteInstallmentGroupOnUpdate(
    root: Expense,
    preserveDatesUpToInstallment: number,
    user: User,
    fields: {
      name: string;
      uri?: string;
      date: Date;
      store: Store;
      payment: Payment;
    },
    totalValue: number,
    recurrence: RecurrenceConfigDto,
    manager: EntityManager,
  ): Promise<void> {
    const groupId = root.installmentGroupId ?? randomUUID();
    const schedule = this.installmentPlanner.buildFiniteSchedule(
      toInstallmentCalendarDate(root.date),
      totalValue,
      recurrence,
    );
    const totalCount = recurrence.count ?? schedule.length;
    const existing = root.installmentGroupId
      ? await this.expenseRepository.findByInstallmentGroup(groupId)
      : [root];

    for (const slice of schedule) {
      const sliceMeta: ResolvedInstallmentMeta = {
        installmentGroupId: groupId,
        installmentNumber: slice.installmentNumber,
        totalInstallments: totalCount,
        isInstallment: true,
        repeat: false,
      };
      const member = existing.find(
        (entry) => entry.installmentNumber === slice.installmentNumber,
      );
      const installmentPayload = this.installmentPlanner.mergeInstallmentFields(
        {},
        sliceMeta,
        slice.installmentNumber === 1 ? (root.photos ?? []) : [],
      );
      const shouldPreserveDate =
        !!member && slice.installmentNumber <= preserveDatesUpToInstallment;
      const patch = {
        ...fields,
        value: slice.value,
        date: shouldPreserveDate
          ? member.date
          : toInstallmentCalendarDate(slice.date),
        ...installmentPayload,
      };

      if (member) {
        await this.expenseRepository.update(
          member,
          { ...member, ...patch },
          manager,
        );
      } else {
        await this.expenseRepository.create(
          user,
          fields.store,
          fields.payment,
          patch as never,
          manager,
        );
      }
    }

    for (const member of existing) {
      if ((member.installmentNumber ?? 0) > schedule.length) {
        await this.expenseRepository.delete(member.id);
      }
    }
  }

  private async syncInstallmentMetaOnGroup(
    groupId: string,
    meta: ResolvedInstallmentMeta,
    manager: EntityManager,
  ): Promise<void> {
    const members =
      await this.expenseRepository.findByInstallmentGroup(groupId);
    for (const member of members) {
      await this.expenseRepository.update(
        member,
        {
          ...member,
          repeat: meta.repeat,
          totalInstallments: meta.totalInstallments,
          isInstallment: meta.isInstallment,
          installmentGroupId: meta.installmentGroupId,
        } as Partial<Expense>,
        manager,
      );
    }
  }

  private async removeExtraInstallmentMembers(
    root: Expense,
    manager: EntityManager,
  ): Promise<void> {
    if (!root.installmentGroupId) return;

    const members = await this.expenseRepository.findByInstallmentGroup(
      root.installmentGroupId,
    );

    for (const member of members) {
      if (member.id === root.id) {
        await this.expenseRepository.update(
          member,
          {
            ...member,
            installmentGroupId: null,
            installmentNumber: null,
            totalInstallments: null,
            isInstallment: false,
            repeat: false,
          } as Partial<Expense>,
          manager,
        );
      } else {
        await this.expenseRepository.delete(member.id);
      }
    }
  }

  private async upsertExpenseItems(
    root: Expense,
    itemsToUpdate: itemType[],
    baseDate: Date,
    user: User,
    manager: EntityManager,
  ): Promise<void> {
    for (let index = 0; index < itemsToUpdate.length; index++) {
      const item = itemsToUpdate[index];
      if (item.group) {
        let updateGroup = await this.groupService.findByName(
          item.group.name,
          user,
        );

        if (!updateGroup) {
          updateGroup = await this.groupService.create(
            item.group,
            user,
            manager,
          );
        }
        item.group = updateGroup;
      }

      const itemPayload = this.normalizeItemLine({
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        value: item.value,
        total: item.total,
        group: item.group,
        warrantyDuration: item.warrantyDuration,
        warrantyUnit: item.warrantyUnit,
      });
      const itemPayloadWithWarranty = {
        ...itemPayload,
        ...this.installmentPlanner.normalizeItemWarranty(item, baseDate),
      };

      if (!item.id || item.id === '') {
        const { id: _id, ...itemWithoutId } = item;
        await this.expenseRepository.createItem(
          root,
          item.group as Group,
          { ...itemWithoutId, ...itemPayloadWithWarranty },
          manager,
        );
      } else {
        const updateItem = await this.expenseRepository.findItemById(item.id);
        if (!updateItem) {
          throw new UpdateException();
        }

        await this.expenseRepository.UpdateItem(
          updateItem,
          itemPayloadWithWarranty,
          manager,
        );
      }
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
      throw error;
    }
  }

  async remove(expenseId: string): Promise<Expense> {
    return this.expenseRepository.remove(expenseId);
  }

  async delete(expenseId: string, deleteGroup = false): Promise<boolean> {
    const expense = await this.expenseRepository.find(expenseId);
    if (!expense) return false;

    if (deleteGroup && expense.installmentGroupId) {
      const group = await this.expenseRepository.findByInstallmentGroup(
        expense.installmentGroupId,
      );
      for (const member of group) {
        await this.expenseRepository.delete(member.id);
      }
      return true;
    }

    return this.expenseRepository.delete(expenseId);
  }

  async getReceipt(
    expenseId: string,
    userId: string,
  ): Promise<ExpenseReceiptDto> {
    const expense = await this.expenseRepository.find(expenseId);
    if (!expense) throw new NotExistException();
    if (expense.user?.id !== userId) throw new ForbiddenException();

    let items = expense.items ?? [];
    let photos = expense.photos ?? [];
    const isRoot = !expense.isInstallment || expense.installmentNumber === 1;
    let groupMembers: Expense[] = [];

    if (expense.installmentGroupId) {
      groupMembers = await this.expenseRepository.findByInstallmentGroup(
        expense.installmentGroupId,
      );
    }

    if (expense.installmentGroupId && !isRoot) {
      const root = await this.expenseRepository.findInstallmentRoot(
        expense.installmentGroupId,
      );
      if (root) {
        items = root.items ?? [];
        photos = root.photos ?? [];
      }
    }

    const itemsTotal = items.length
      ? this.calculateTotalValue(items as itemType[])
      : undefined;
    const { installmentValue, totalValue } = computeReceiptAmounts(
      expense,
      groupMembers,
      itemsTotal,
    );

    return {
      id: expense.id,
      type: 'expense',
      name: expense.name,
      value: installmentValue,
      installmentValue,
      totalValue,
      date: expense.date,
      uri: expense.uri ?? '',
      photos,
      isInstallmentRoot: isRoot,
      installment: {
        installmentNumber: expense.installmentNumber,
        totalInstallments: expense.totalInstallments,
        installmentGroupId: expense.installmentGroupId,
        isInstallment: expense.isInstallment,
        installmentLabel: buildInstallmentLabel(
          expense.installmentNumber,
          expense.totalInstallments,
        ),
      },
      store: expense.store,
      payment: expense.payment,
      items,
      user: expense.user,
    };
  }

  private async getPhotoTargetExpense(
    expenseId: string,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.expenseRepository.find(expenseId);
    if (!expense) throw new NotExistException();
    if (expense.user?.id !== userId) throw new ForbiddenException();

    if (expense.installmentGroupId && expense.installmentNumber !== 1) {
      const root = await this.expenseRepository.findInstallmentRoot(
        expense.installmentGroupId,
      );
      if (root) return root;
    }
    return expense;
  }

  async uploadPhoto(
    expenseId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Expense> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }
    if (!this.imageMimeRegex.test(file.mimetype)) {
      throw new BadRequestException(
        'Apenas imagens (jpg, jpeg, png, gif, webp) são permitidas',
      );
    }

    const expense = await this.getPhotoTargetExpense(expenseId, userId);
    const photos = expense.photos ?? [];
    if (photos.length >= MAX_PHOTOS_PER_FINANCIAL) {
      throw new BadRequestException(
        `Limite de ${MAX_PHOTOS_PER_FINANCIAL} fotos por despesa.`,
      );
    }

    const ext =
      file.originalname
        ?.split('.')
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const fileName = `expense-${randomUUID()}.${ext.length > 8 ? 'jpg' : ext}`;
    const uploaded = await this.fileStorage.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
      'expense',
    );

    return this.expenseRepository.save({
      ...expense,
      photos: [...photos, uploaded.webContentLink],
    });
  }

  async removePhoto(
    expenseId: string,
    photoUrl: string,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.getPhotoTargetExpense(expenseId, userId);
    const photos = expense.photos ?? [];
    if (!photos.includes(photoUrl)) {
      throw new BadRequestException('Foto não encontrada nesta despesa');
    }

    try {
      const fileId = this.fileStorage.extractFileIdFromUrl(photoUrl);
      if (fileId) await this.fileStorage.deleteFile(fileId);
    } catch {
      /* ignore storage cleanup errors */
    }

    return this.expenseRepository.save({
      ...expense,
      photos: photos.filter((u) => u !== photoUrl),
    });
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

  private normalizeItemLine(item: itemType): itemType {
    const value = Number(item.value);
    const quantity = Number(item.quantity);
    const total =
      item.total != null && !Number.isNaN(Number(item.total))
        ? Number(Number(item.total).toFixed(2))
        : Number((value * quantity).toFixed(2));

    return {
      ...item,
      value,
      quantity,
      total,
    };
  }

  private calculateTotalValue = (items: itemType[]): number => {
    if (!items || items.length === 0) return 0;

    const total = items.reduce((sum, item) => {
      return sum + this.normalizeItemLine(item).total;
    }, 0);

    return Number((Math.round(total * 100) / 100).toFixed(2));
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

  private normalizeExpenseDtoItems(dto: CreateExpenseDto): CreateExpenseDto {
    return {
      ...dto,
      items: (dto.items ?? []).map((item) => this.normalizeItemLine(item)),
    };
  }

  async recurringConfirm(
    user: User,
    expenseRecurringConfirmDto: ExpenseRecurringConfirmDto,
  ): Promise<void> {
    const { expenses, expenseIds } = expenseRecurringConfirmDto;

    for (const expenseId of expenseIds) {
      await this.updateRecurringExpenseToFalse(expenseId);
    }

    for (let i = 0; i < expenses.length; i++) {
      const expenseDto = this.normalizeExpenseDtoItems(expenses[i]);
      const sourceId = expenseIds[i];
      const source = sourceId
        ? await this.expenseRepository.find(sourceId)
        : null;

      const currentMonth = new Date().getMonth() + 1;
      expenseDto.date = setSpecificMonth(expenseDto.date, currentMonth);

      if (
        source?.isInstallment &&
        source.totalInstallments == null &&
        source.installmentGroupId
      ) {
        const nextNumber =
          this.installmentPlanner.nextInfiniteInstallmentNumber(
            source.installmentNumber,
          );
        await this.persistRecurringInfiniteInstallment(
          user,
          expenseDto,
          source,
          nextNumber,
        );
      } else {
        expenseDto.repeat = source?.repeat ?? false;
        await this.create(user, expenseDto);
      }
    }
  }

  private async persistRecurringInfiniteInstallment(
    user: User,
    dto: CreateExpenseDto,
    source: Expense,
    installmentNumber: number,
  ): Promise<void> {
    const meta: ResolvedInstallmentMeta = {
      installmentGroupId: source.installmentGroupId,
      installmentNumber,
      totalInstallments: null,
      isInstallment: true,
      repeat: true,
    };

    await this.queryRunnerFactory.startTransaction();
    try {
      const expense = await this.persistExpense(user, dto, meta, true);
      await this.queryRunnerFactory.commitTransaction();
      await this.afterExpenseCreated(user, expense, dto.uri);
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw error;
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
