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
