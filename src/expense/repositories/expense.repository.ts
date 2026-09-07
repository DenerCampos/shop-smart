import { Injectable } from '@nestjs/common';
import { EntityManager, Repository, In } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { IExpenseRepository } from '../interface/expense.repository.interface';
import { Expense } from '../entities/expense.entity';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../entities/item.entity';
import { Group } from 'src/group/entities/group.entity';
import { CreateExpenseEntityDto } from '../dto/create-expense-entity.dto';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { CreateItemEntityDto } from '../dto/create-item-entity.dto';
import { UpdateItemEntityDto } from '../dto/update-item-entity.dto';
import { nextCalendarDateString } from 'src/common/utils/dates.util';

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(
    @InjectRepository(Expense)
    private expenseEntity: Repository<Expense>,
    @InjectRepository(Item)
    private itemEntity: Repository<Item>,
  ) {}

  async create(
    user: User,
    store: Store,
    payment: Payment,
    createExpenseDto: CreateExpenseEntityDto,
    manager?: EntityManager,
  ): Promise<Expense> {
    const repository = manager
      ? manager.getRepository(Expense)
      : this.expenseEntity;

    const expense = repository.create({
      ...createExpenseDto,
      user,
      store,
      payment,
    });

    return repository.save(expense);
  }

  async createItem(
    expense: Expense,
    group: Group,
    createItemDto: CreateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item> {
    const repository = manager ? manager.getRepository(Item) : this.itemEntity;

    const item = repository.create({
      ...createItemDto,
      expense,
      group,
    });

    return repository.save(item);
  }

  async findAll(
    userIds: string[],
    page: number,
    limit: number,
    search?: string,
    isRecurring?: boolean,
    isInstallment?: boolean,
    startDate?: string,
    endDate?: string,
  ): Promise<[Expense[], number]> {
    const queryBuilder = this.expenseEntity
      .createQueryBuilder('expense')
      .withDeleted();

    queryBuilder.leftJoinAndSelect('expense.items', 'item');
    queryBuilder.leftJoinAndSelect('expense.payment', 'payment');
    queryBuilder.leftJoinAndSelect('expense.store', 'store');
    queryBuilder.leftJoinAndSelect('item.group', 'group');
    queryBuilder
      .leftJoin('expense.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.profileImage']);

    queryBuilder.where('expense.user IN (:...userIds)', { userIds });
    queryBuilder.andWhere('expense.deletedAt IS NULL');
    queryBuilder.andWhere('(item.deletedAt IS NULL OR item.id IS NULL)');

    if (search) {
      queryBuilder.andWhere('LOWER(expense.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (isRecurring !== undefined) {
      queryBuilder.andWhere('expense.repeat = :isRecurring', { isRecurring });
    }

    if (isInstallment !== undefined) {
      queryBuilder.andWhere('expense.isInstallment = :isInstallment', {
        isInstallment,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'expense.date >= :startDate AND expense.date < :endDateExclusive',
        { startDate, endDateExclusive: nextCalendarDateString(endDate) },
      );
    }

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    queryBuilder.orderBy('expense.createdAt', 'DESC');

    return await queryBuilder.getManyAndCount();
  }

  async countAll(): Promise<number> {
    return await this.expenseEntity.count({
      withDeleted: false,
    });
  }

  async countByUser(userIds: string[]): Promise<number> {
    if (!userIds || userIds.length === 0) return 0;

    return await this.expenseEntity
      .createQueryBuilder('expense')
      .where('expense.userId IN (:...userIds)', { userIds })
      .andWhere('expense.deletedAt IS NULL')
      .getCount();
  }

  async find(id: string): Promise<Expense | null> {
    return await this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.items', 'item', 'item.deletedAt IS NULL')
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('expense.payment', 'payment')
      .leftJoinAndSelect('expense.store', 'store')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.id = :id', { id })
      .orderBy('item.createdAt', 'ASC')
      .getOne();
  }

  async findItemById(id: string): Promise<Item | null> {
    return await this.itemEntity.findOne({
      where: { id },
      relations: ['group', 'expense'],
    });
  }

  async findAllItemsByExpenseId(expenseId: string): Promise<Item[]> {
    return await this.itemEntity.find({
      where: { expense: { id: expenseId } },
      relations: ['group'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    expense: Expense,
    patch: Partial<Expense>,
    manager?: EntityManager,
  ): Promise<Expense> {
    const repository = manager
      ? manager.getRepository(Expense)
      : this.expenseEntity;

    return await repository.save({
      ...expense,
      ...patch,
    });
  }

  async UpdateItem(
    item: Item,
    updateItemDto: UpdateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item> {
    const repository = manager ? manager.getRepository(Item) : this.itemEntity;

    // Extrair apenas as propriedades que queremos atualizar
    const {
      code,
      name,
      quantity,
      unit,
      value,
      total,
      warrantyDuration,
      warrantyUnit,
      warrantyExpiresAt,
    } = updateItemDto;

    return await repository.save({
      ...item,
      code,
      name,
      quantity,
      unit,
      value,
      total,
      warrantyDuration,
      warrantyUnit: warrantyUnit as Item['warrantyUnit'],
      warrantyExpiresAt,
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
      .andWhere('DATE(expense.date) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('expense.date', 'ASC');

    return await query.getMany();
  }

  async findByPeriodWithItems(
    userIds: string[],
    startDate: string,
    endDate: string,
    limit = 100,
  ): Promise<Expense[]> {
    if (!userIds.length) return [];

    const take = Math.max(1, Math.min(limit, 500));

    return this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.items', 'item', 'item.deletedAt IS NULL')
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('expense.store', 'store')
      .leftJoin('expense.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .where('expense.user IN (:...userIds)', { userIds })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('DATE(expense.date) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('expense.date', 'DESC')
      .addOrderBy('item.createdAt', 'ASC')
      .take(take)
      .getMany();
  }

  /**
   * Busca itens de despesa com filtros no SQL (uso do Assistente Familiar).
   * Sem from/to = toda a base; com intervalo = date >= from AND date < dia seguinte a to.
   */
  async searchItems(filter: {
    userIds: string[];
    name?: string;
    category?: string;
    store?: string;
    from?: string | null;
    to?: string | null;
    limit: number;
  }): Promise<
    Array<{
      expenseId: string;
      expenseName: string;
      date: Date;
      store: string | null;
      itemName: string;
      quantity: number;
      unit: string;
      total: number;
      category: string | null;
      userId: string;
    }>
  > {
    if (!filter.userIds.length) return [];

    const take = Math.max(1, Math.min(filter.limit, 100));
    const qb = this.expenseEntity
      .createQueryBuilder('expense')
      .innerJoin('expense.items', 'item', 'item.deletedAt IS NULL')
      .leftJoin('item.group', 'grp')
      .leftJoin('expense.store', 'store')
      .leftJoin('expense.user', 'user')
      .select([
        'expense.id AS expenseId',
        'expense.name AS expenseName',
        'expense.date AS date',
        'store.name AS store',
        'item.name AS itemName',
        'item.quantity AS quantity',
        'item.unit AS unit',
        'item.total AS total',
        'grp.name AS category',
        'user.id AS userId',
      ])
      .where('expense.user IN (:...userIds)', { userIds: filter.userIds })
      .andWhere('expense.deletedAt IS NULL');

    if (filter.from && filter.to) {
      qb.andWhere('expense.date >= :from AND expense.date < :toExclusive', {
        from: filter.from,
        toExclusive: nextCalendarDateString(filter.to),
      });
    }

    if (filter.name) {
      qb.andWhere("LOWER(item.name) LIKE :name ESCAPE '\\\\'", {
        name: `%${escapeLikePattern(filter.name.toLowerCase())}%`,
      });
    }

    if (filter.category) {
      qb.andWhere("LOWER(grp.name) LIKE :category ESCAPE '\\\\'", {
        category: `%${escapeLikePattern(filter.category.toLowerCase())}%`,
      });
    }

    if (filter.store) {
      qb.andWhere("LOWER(store.name) LIKE :store ESCAPE '\\\\'", {
        store: `%${escapeLikePattern(filter.store.toLowerCase())}%`,
      });
    }

    qb.orderBy('expense.date', 'DESC')
      .addOrderBy('item.createdAt', 'ASC')
      .limit(take);

    const rows = await qb.getRawMany();
    return rows.map((row) => ({
      expenseId: row.expenseId ?? row.expenseid,
      expenseName: row.expenseName ?? row.expensename,
      date: row.date,
      store: row.store ?? null,
      itemName: row.itemName ?? row.itemname,
      quantity: Number(row.quantity),
      unit: row.unit,
      total: Number(row.total),
      category: row.category ?? null,
      userId: row.userId ?? row.userid,
    }));
  }

  async findByMonth(userId: string, month: number): Promise<Expense[] | []> {
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('expense.repeat = true')
      .andWhere('EXTRACT(MONTH FROM expense.date) = :month', { month })
      .orderBy('expense.date', 'ASC');

    return await query.getMany();
  }

  async findRecurringByMonthAndDay(
    userId: string,
    month: number,
    day: number,
  ): Promise<Expense[] | []> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.items', 'item')
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('expense.payment', 'payment')
      .leftJoinAndSelect('expense.store', 'store')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('expense.repeat = true')
      .andWhere(
        `(
          (EXTRACT(YEAR FROM expense.date) < :currentYear)
          OR 
          (
            EXTRACT(YEAR FROM expense.date) = :currentYear 
            AND EXTRACT(MONTH FROM expense.date) < :currentMonth
          )
          OR
          (
            EXTRACT(YEAR FROM expense.date) = :currentYear 
            AND EXTRACT(MONTH FROM expense.date) = :month 
            AND EXTRACT(DAY FROM expense.date) <= :day
          )
        )`,
        { currentYear, currentMonth, month, day },
      )
      .orderBy('expense.date', 'ASC');

    return await query.getMany();
  }

  async exist(userId: string): Promise<boolean> {
    const hasData = await this.expenseEntity
      .createQueryBuilder('expense')
      .where('expense.user = :userId', { userId })
      .limit(1)
      .getOne();

    return hasData !== null;
  }

  async getLatest(userIds: string[], limit: number): Promise<Expense[] | []> {
    if (!userIds || userIds.length === 0) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoin('expense.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.profileImage'])
      .where('expense.userId IN (:...userIds)', { userIds })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere(
        `(
          expense.isInstallment = false
          OR expense.totalInstallments IS NULL
          OR (
            expense.isInstallment = true
            AND expense.totalInstallments IS NOT NULL
            AND EXTRACT(YEAR FROM expense.date) = :currentYear
            AND EXTRACT(MONTH FROM expense.date) = :currentMonth
          )
        )`,
        { currentYear, currentMonth },
      )
      .take(limit)
      .orderBy('expense.createdAt', 'DESC');

    return await query.getMany();
  }

  async findInstallmentRoot(groupId: string): Promise<Expense | null> {
    return await this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.items', 'item', 'item.deletedAt IS NULL')
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('expense.payment', 'payment')
      .leftJoinAndSelect('expense.store', 'store')
      .leftJoinAndSelect('expense.user', 'user')
      .where('expense.installmentGroupId = :groupId', { groupId })
      .andWhere('expense.installmentNumber = :num', { num: 1 })
      .orderBy('item.createdAt', 'ASC')
      .getOne();
  }

  async findByInstallmentGroup(groupId: string): Promise<Expense[]> {
    return this.expenseEntity.find({
      where: { installmentGroupId: groupId },
      order: { installmentNumber: 'ASC' },
    });
  }

  async getMostUsedPaymentName(): Promise<string | null> {
    const result = await this.expenseEntity
      .createQueryBuilder('expense')
      .innerJoin('payment', 'payment')
      .select('payment.name', 'paymentName')
      .addSelect('COUNT(expense.paymentId)', 'usage_count')
      .where('expense.deletedAt IS NULL')
      .andWhere('expense.paymentId IS NOT NULL')
      .groupBy('expense.paymentId')
      .addGroupBy('payment.name')
      .orderBy('usage_count', 'DESC')
      .limit(1)
      .getRawOne();

    return result?.paymentName || null;
  }

  async getGroupByItemName(itemName: string): Promise<string | null> {
    const result = await this.itemEntity
      .createQueryBuilder('item')
      .innerJoin('item.group', 'group')
      .select('group.name', 'groupName')
      .where('item.name = :itemName', { itemName })
      .getRawOne();

    return result?.groupName || null;
  }

  async getGroupByItemNamePartial(itemName: string): Promise<string | null> {
    const result = await this.itemEntity
      .createQueryBuilder('item')
      .innerJoin('group', 'group')
      .select('group.name', 'groupName')
      .where('item.name LIKE :itemName', { itemName: `%${itemName}%` })
      .getRawOne();

    return result?.groupName || null;
  }

  async removeItem(id: string): Promise<void> {
    await this.itemEntity.softDelete({ id });
  }

  async removeItems(itemIds: string[], manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(Item) : this.itemEntity;

    await repository.softDelete({ id: In(itemIds) });
  }

  async save(expense: Expense, manager?: EntityManager): Promise<Expense> {
    const repository = manager
      ? manager.getRepository(Expense)
      : this.expenseEntity;
    return repository.save(expense);
  }
}
