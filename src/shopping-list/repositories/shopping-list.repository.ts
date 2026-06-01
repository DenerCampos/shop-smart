import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingListItem } from '../entities/shopping-list-item.entity';
import { IShoppingListRepository } from '../interfaces/shopping-list.repository.interface';
import { User } from 'src/user/entities/user.entity';
import { ShoppingListStatus } from '../types/shopping-list-status.type';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { Group } from 'src/group/entities/group.entity';
import { Item } from 'src/expense/entities/item.entity';
import { SHOPPING_LIST_ITEM_STATUS } from '../types/shopping-list-item-status.type';
import { SHOPPING_LIST_STATUS } from '../types/shopping-list-status.type';

@Injectable()
export class ShoppingListRepository implements IShoppingListRepository {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly listRepo: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private readonly itemRepo: Repository<ShoppingListItem>,
    @InjectRepository(Item)
    private readonly expenseItemRepo: Repository<Item>,
    private readonly dataSource: DataSource,
  ) {}

  async createList(
    name: string,
    user: User,
    familyGroup?: FamilyGroup,
  ): Promise<ShoppingList> {
    const list = this.listRepo.create({
      name,
      createdBy: user,
      ...(familyGroup && { familyGroup }),
    });

    const saved = await this.listRepo.save(list);

    return this.findListById(saved.id);
  }

  async findAllByUser(
    userId: string,
    familyGroupIds: string[],
    offset: number,
    limit: number,
    status?: ShoppingListStatus,
  ): Promise<[ShoppingList[], number]> {
    // Mesmo padrão de expense.repository findAll: leftJoin + addSelect para que
    // createdBy/familyGroup entrem no plain do class-transformer (instanceToPlain).
    const qb = this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .leftJoinAndSelect('list.items', 'items')
      .where('list.deletedAt IS NULL');

    if (familyGroupIds.length > 0) {
      qb.andWhere(
        '(list.createdById = :userId OR list.familyGroupId IN (:...familyGroupIds))',
        { userId, familyGroupIds },
      );
    } else {
      qb.andWhere('list.createdById = :userId', { userId });
    }

    if (status) {
      qb.andWhere('list.status = :status', { status });
    }

    qb.orderBy('list.updatedAt', 'DESC').skip(offset).take(limit);

    return qb.getManyAndCount();
  }

  async findListById(id: string): Promise<ShoppingList | null> {
    return this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .leftJoinAndSelect('list.items', 'items')
      .where('list.id = :id', { id })
      .andWhere('list.deletedAt IS NULL')
      .getOne();
  }

  async findListWithItems(id: string): Promise<ShoppingList | null> {
    // Cabeçalho da lista: leftJoin + addSelect (compatível com instanceToPlain no mapToDto).
    // Itens: leftJoinAndSelect em cadeia — combinar leftJoin+addSelect só em `items.*`
    // após leftJoinAndSelect('list.items') quebra a hidratação da coleção (array vazio).
    return this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .leftJoinAndSelect('list.items', 'items', 'items.deletedAt IS NULL')
      .leftJoinAndSelect('items.group', 'itemGroup')
      .leftJoinAndSelect('items.addedBy', 'itemAddedBy')
      .leftJoinAndSelect('items.checkedBy', 'itemCheckedBy')
      .where('list.id = :id', { id })
      .andWhere('list.deletedAt IS NULL')
      .orderBy('items.status', 'ASC')
      .addOrderBy('items.createdAt', 'DESC')
      .getOne();
  }

  async findByNameAndUser(
    name: string,
    userId: string,
    familyGroupIds: string[],
  ): Promise<ShoppingList | null> {
    const qb = this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .where('LOWER(list.name) = LOWER(:name)', { name })
      .andWhere('list.deletedAt IS NULL');

    if (familyGroupIds.length > 0) {
      qb.andWhere(
        '(list.createdById = :userId OR list.familyGroupId IN (:...familyGroupIds))',
        { userId, familyGroupIds },
      );
    } else {
      qb.andWhere('list.createdById = :userId', { userId });
    }

    return qb.getOne();
  }

  async updateList(
    list: ShoppingList,
    data: Partial<ShoppingList>,
  ): Promise<ShoppingList> {
    const updated = await this.listRepo.save({ ...list, ...data });
    return this.findListById(updated.id);
  }

  async deleteList(id: string): Promise<boolean> {
    const result = await this.listRepo.softDelete({ id });
    return result.affected === 1;
  }

  async createItem(
    list: ShoppingList,
    user: User,
    name: string,
    quantity: number,
    unit: string,
    groupId?: string,
  ): Promise<ShoppingListItem> {
    const itemData: Partial<ShoppingListItem> = {
      name,
      quantity,
      unit: unit as any,
      shoppingList: list,
      addedBy: user,
    };

    if (groupId) {
      itemData.group = { id: groupId } as Group;
    }

    const item = this.itemRepo.create(itemData);
    const saved = await this.itemRepo.save(item);

    return this.findItemById(saved.id);
  }

  async findItemById(id: string): Promise<ShoppingListItem | null> {
    return this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.shoppingList', 'list')
      .leftJoin('list.familyGroup', 'listFamilyGroup')
      .addSelect(['listFamilyGroup.id', 'listFamilyGroup.name'])
      .leftJoin('list.createdBy', 'listCreatedBy')
      .addSelect([
        'listCreatedBy.id',
        'listCreatedBy.name',
        'listCreatedBy.profileImage',
      ])
      .leftJoin('item.group', 'igroup')
      .addSelect([
        'igroup.id',
        'igroup.name',
        'igroup.createdAt',
        'igroup.updatedAt',
      ])
      .leftJoin('item.addedBy', 'iaddedBy')
      .addSelect(['iaddedBy.id', 'iaddedBy.name', 'iaddedBy.profileImage'])
      .leftJoin('item.checkedBy', 'icheckedBy')
      .addSelect([
        'icheckedBy.id',
        'icheckedBy.name',
        'icheckedBy.profileImage',
      ])
      .where('item.id = :id', { id })
      .andWhere('item.deletedAt IS NULL')
      .andWhere('list.deletedAt IS NULL')
      .getOne();
  }

  async updateItem(
    item: ShoppingListItem,
    data: Partial<ShoppingListItem>,
  ): Promise<ShoppingListItem> {
    const updated = await this.itemRepo.save({ ...item, ...data });
    return this.findItemById(updated.id);
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await this.itemRepo.softDelete({ id });
    return result.affected === 1;
  }

  async completeAllItems(listId: string, userId: string): Promise<void> {
    await this.itemRepo
      .createQueryBuilder()
      .update(ShoppingListItem)
      .set({
        status: SHOPPING_LIST_ITEM_STATUS.IN_CART,
        checkedBy: { id: userId } as User,
      })
      .where('shoppingListId = :listId', { listId })
      .andWhere('status = :status', {
        status: SHOPPING_LIST_ITEM_STATUS.PENDING,
      })
      .execute();
  }

  async findSuggestions(
    userIds: string[],
    search: string,
    limit = 10,
  ): Promise<
    {
      name: string;
      groupName: string | null;
      unit: string | null;
      frequency: number;
    }[]
  > {
    const expenseItems = await this.expenseItemRepo
      .createQueryBuilder('item')
      .select('item.name', 'name')
      .addSelect('group.name', 'groupName')
      .addSelect('item.unit', 'unit')
      .addSelect('COUNT(*)', 'frequency')
      .leftJoin('item.group', 'group')
      .leftJoin('item.expense', 'expense')
      .where('LOWER(item.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      })
      .andWhere('expense.userId IN (:...userIds)', { userIds })
      .groupBy('item.name')
      .addGroupBy('group.name')
      .addGroupBy('item.unit')
      .orderBy('frequency', 'DESC')
      .limit(limit)
      .getRawMany();

    const shoppingItems = await this.itemRepo
      .createQueryBuilder('sItem')
      .select('sItem.name', 'name')
      .addSelect('group.name', 'groupName')
      .addSelect('sItem.unit', 'unit')
      .addSelect('COUNT(*)', 'frequency')
      .leftJoin('sItem.group', 'group')
      .leftJoin('sItem.shoppingList', 'list')
      .where('LOWER(sItem.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      })
      .andWhere('list.createdById IN (:...userIds)', { userIds })
      .groupBy('sItem.name')
      .addGroupBy('group.name')
      .addGroupBy('sItem.unit')
      .orderBy('frequency', 'DESC')
      .limit(limit)
      .getRawMany();

    const merged = new Map<
      string,
      {
        name: string;
        groupName: string | null;
        unit: string | null;
        frequency: number;
      }
    >();

    for (const item of [...expenseItems, ...shoppingItems]) {
      const key = item.name.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        existing.frequency += Number(item.frequency);
      } else {
        merged.set(key, {
          name: item.name,
          groupName: item.groupName ?? null,
          unit: item.unit ?? null,
          frequency: Number(item.frequency),
        });
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  async findItemByNameInList(
    listId: string,
    name: string,
  ): Promise<ShoppingListItem | null> {
    return this.itemRepo
      .createQueryBuilder('item')
      .leftJoin('item.shoppingList', 'list')
      .where('list.id = :listId', { listId })
      .andWhere('item.name LIKE :name', { name: `%${name}%` })
      .andWhere('item.deletedAt IS NULL')
      .andWhere('list.deletedAt IS NULL')
      .getOne();
  }

  async findActiveListByUser(
    userId: string,
    familyGroupIds: string[],
  ): Promise<ShoppingList | null> {
    const qb = this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .where('list.status = :status', { status: 'active' })
      .andWhere('list.deletedAt IS NULL');

    if (familyGroupIds.length > 0) {
      qb.andWhere(
        '(list.createdById = :userId OR list.familyGroupId IN (:...familyGroupIds))',
        { userId, familyGroupIds },
      );
    } else {
      qb.andWhere('list.createdById = :userId', { userId });
    }

    qb.orderBy('list.updatedAt', 'DESC');

    return qb.getOne();
  }

  async finalizeWithRemainingAndBranch(
    list: ShoppingList,
    user: User,
    pendingItems: ShoppingListItem[],
  ): Promise<{ completed: ShoppingList; newList: ShoppingList }> {
    return this.dataSource.transaction(async (manager) => {
      await this.completeAllItemsWithManager(manager, list.id, user.id);

      await manager.update(ShoppingList, list.id, {
        status: SHOPPING_LIST_STATUS.COMPLETED,
      });

      const newList = await this.createListWithManager(
        manager,
        list.name,
        user,
        list.familyGroup ?? undefined,
      );

      await this.copyItemsWithManager(manager, pendingItems, newList, user);

      const completed = await this.findListByIdWithManager(manager, list.id);
      const reloadedNewList = await this.findListByIdWithManager(
        manager,
        newList.id,
      );

      if (!completed || !reloadedNewList) {
        throw new InternalServerErrorException(
          'Falha ao recarregar listas após finalização parcial.',
        );
      }

      return { completed, newList: reloadedNewList };
    });
  }

  async recreateFromCompleted(
    list: ShoppingList,
    user: User,
  ): Promise<ShoppingList> {
    return this.dataSource.transaction(async (manager) => {
      const newList = await this.createListWithManager(
        manager,
        list.name,
        user,
        list.familyGroup ?? undefined,
      );

      await this.copyItemsWithManager(
        manager,
        list.items ?? [],
        newList,
        user,
      );

      const reloaded = await this.findListByIdWithManager(manager, newList.id);

      if (!reloaded) {
        throw new InternalServerErrorException(
          'Falha ao recarregar lista recriada.',
        );
      }

      return reloaded;
    });
  }

  private async completeAllItemsWithManager(
    manager: EntityManager,
    listId: string,
    userId: string,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ShoppingListItem)
      .set({
        status: SHOPPING_LIST_ITEM_STATUS.IN_CART,
        checkedBy: { id: userId } as User,
      })
      .where('shoppingListId = :listId', { listId })
      .andWhere('status = :status', {
        status: SHOPPING_LIST_ITEM_STATUS.PENDING,
      })
      .execute();
  }

  private async createListWithManager(
    manager: EntityManager,
    name: string,
    user: User,
    familyGroup?: FamilyGroup,
  ): Promise<ShoppingList> {
    const list = manager.create(ShoppingList, {
      name,
      createdBy: user,
      ...(familyGroup && { familyGroup }),
    });

    return manager.save(list);
  }

  private async copyItemsWithManager(
    manager: EntityManager,
    sourceItems: ShoppingListItem[],
    targetList: ShoppingList,
    user: User,
  ): Promise<void> {
    for (const item of sourceItems) {
      const itemData: Partial<ShoppingListItem> = {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        shoppingList: targetList,
        addedBy: user,
      };

      if (item.group?.id) {
        itemData.group = { id: item.group.id } as Group;
      }

      await manager.save(manager.create(ShoppingListItem, itemData));
    }
  }

  private async findListByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<ShoppingList | null> {
    return manager
      .getRepository(ShoppingList)
      .createQueryBuilder('list')
      .leftJoin('list.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('list.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .leftJoinAndSelect('list.items', 'items', 'items.deletedAt IS NULL')
      .where('list.id = :id', { id })
      .andWhere('list.deletedAt IS NULL')
      .getOne();
  }
}
