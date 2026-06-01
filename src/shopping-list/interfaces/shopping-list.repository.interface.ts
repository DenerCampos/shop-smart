import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { User } from 'src/user/entities/user.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingListItem } from '../entities/shopping-list-item.entity';
import { ShoppingListStatus } from '../types/shopping-list-status.type';

export interface IShoppingListRepository {
  createList(
    name: string,
    user: User,
    familyGroup?: FamilyGroup,
  ): Promise<ShoppingList>;

  findAllByUser(
    userId: string,
    familyGroupIds: string[],
    offset: number,
    limit: number,
    status?: ShoppingListStatus,
  ): Promise<[ShoppingList[], number]>;

  findListById(id: string): Promise<ShoppingList | null>;

  findListWithItems(id: string): Promise<ShoppingList | null>;

  findByNameAndUser(
    name: string,
    userId: string,
    familyGroupIds: string[],
  ): Promise<ShoppingList | null>;

  updateList(
    list: ShoppingList,
    data: Partial<ShoppingList>,
  ): Promise<ShoppingList>;

  deleteList(id: string): Promise<boolean>;

  createItem(
    list: ShoppingList,
    user: User,
    name: string,
    quantity: number,
    unit: string,
    groupId?: string,
  ): Promise<ShoppingListItem>;

  findItemById(id: string): Promise<ShoppingListItem | null>;

  updateItem(
    item: ShoppingListItem,
    data: Partial<ShoppingListItem>,
  ): Promise<ShoppingListItem>;

  deleteItem(id: string): Promise<boolean>;

  completeAllItems(listId: string, userId: string): Promise<void>;

  findSuggestions(
    userIds: string[],
    search: string,
    limit?: number,
  ): Promise<
    {
      name: string;
      groupName: string | null;
      unit: string | null;
      frequency: number;
    }[]
  >;

  findActiveListByUser(
    userId: string,
    familyGroupIds: string[],
  ): Promise<ShoppingList | null>;

  findItemByNameInList(
    listId: string,
    name: string,
  ): Promise<ShoppingListItem | null>;

  finalizeWithRemainingAndBranch(
    list: ShoppingList,
    user: User,
    pendingItems: ShoppingListItem[],
  ): Promise<{ completed: ShoppingList; newList: ShoppingList }>;

  recreateFromCompleted(
    list: ShoppingList,
    user: User,
  ): Promise<ShoppingList>;
}
