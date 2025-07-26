import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { IExpenseRepository } from '../interface/expense.repository.interface';
import { Expense } from '../entities/expense.entity';
import { User } from 'src/user/entities/user.entity';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
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
    CreateItemDto: CreateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item> {
    const repository = manager ? manager.getRepository(Item) : this.itemEntity;

    const item = repository.create({
      ...CreateItemDto,
      expense,
      group,
    });

    return repository.save(item);
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Expense[], number]> {
    const queryBuilder = this.expenseEntity
      .createQueryBuilder('expense')
      .withDeleted(); // Permite buscar registros deletados

    queryBuilder.leftJoinAndSelect('expense.items', 'item');
    queryBuilder.leftJoinAndSelect('expense.payment', 'payment');
    queryBuilder.leftJoinAndSelect('expense.store', 'store');
    queryBuilder.leftJoinAndSelect('item.group', 'group');

    // Filtrar para não trazer expense e item deletados
    queryBuilder.where('expense.deletedAt IS NULL');
    queryBuilder.andWhere('(item.deletedAt IS NULL OR item.id IS NULL)');

    if (search) {
      queryBuilder.where('LOWER(expense.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
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

  async find(id: string): Promise<Expense | null> {
    return await this.expenseEntity.findOne({
      where: { id },
      relations: ['items', 'items.group', 'payment', 'store'],
    });
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
    });
  }

  async update(
    expense: Expense,
    updateExpenseDto: UpdateExpenseDto,
    manager?: EntityManager,
  ): Promise<Expense> {
    const repository = manager
      ? manager.getRepository(Expense)
      : this.expenseEntity;

    return await repository.save({
      ...expense,
      ...updateExpenseDto,
    });
  }

  async UpdateItem(
    item: Item,
    updateItemDto: UpdateItemEntityDto,
    manager?: EntityManager,
  ): Promise<Item> {
    const repository = manager ? manager.getRepository(Item) : this.itemEntity;

    return await repository.save({
      ...item,
      ...updateItemDto,
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
    const query = this.expenseEntity
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.items', 'item')
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('expense.payment', 'payment')
      .leftJoinAndSelect('expense.store', 'store')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.deletedAt IS NULL')
      .andWhere('expense.repeat = true')
      .andWhere('EXTRACT(MONTH FROM expense.date) <= :month', { month })
      .andWhere('EXTRACT(DAY FROM expense.date) <= :day', { day })
      .orderBy('expense.date', 'ASC');

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
}
