import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { IShoppingListRepository } from './interfaces/shopping-list.repository.interface';
import { User } from 'src/user/entities/user.entity';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { CreateShoppingListItemDto } from './dto/create-shopping-list-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { ShoppingListFilterDto } from './dto/shopping-list-filter.dto';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { ExpenseService } from 'src/expense/expense.service';
import { GroupService } from 'src/group/group.service';
import { NotExistException } from 'src/exception/notExistException';
import {
  SHOPPING_LIST_ITEM_STATUS,
  ShoppingListItemStatus,
} from './types/shopping-list-item-status.type';
import {
  SHOPPING_LIST_STATUS,
  ShoppingListStatus,
} from './types/shopping-list-status.type';
import { ShoppingListGateway } from './shopping-list.gateway';
import { ResponseService } from 'src/common/response/response';
import { TextRecognitionService } from 'src/text-recognition/textRecognition.service';
import { ShoppingListDetailResponseDto } from './dto/shopping-list-detail-response.dto';
import { ShoppingListItemResponseDto } from './dto/shopping-list-item-response.dto';
import { normalizeShoppingListItemUnit } from './utils/normalize-shopping-list-item-unit';

@Injectable()
export class ShoppingListService {
  private readonly MAX_ACTIVE_LISTS_FOR_VOICE = 100;
  private url = `${this.appConfig.getBaseUrl()}/shopping-lists`;

  constructor(
    @Inject('IShoppingListRepository')
    private readonly repository: IShoppingListRepository,
    private readonly appConfig: AppConfig,
    private readonly pagination: Pagination,
    private readonly familyGroupService: FamilyGroupService,
    private readonly expenseService: ExpenseService,
    private readonly groupService: GroupService,
    private readonly responseService: ResponseService,
    @Inject(forwardRef(() => ShoppingListGateway))
    private readonly shoppingListGateway: ShoppingListGateway,
    private readonly textRecognitionService: TextRecognitionService,
  ) {}

  /**
   * Valida acesso à lista sem carregar todos os itens (ex.: join WebSocket).
   */
  async ensureCanAccessList(listId: string, user: User): Promise<void> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);
  }

  async create(dto: CreateShoppingListDto, user: User): Promise<ShoppingList> {
    let familyGroup = null;

    if (dto.familyGroupId) {
      familyGroup = await this.validateFamilyGroupAccess(
        dto.familyGroupId,
        user.id,
      );
    }

    return this.repository.createList(dto.name, user, familyGroup);
  }

  async findAll(
    dto: ShoppingListFilterDto,
    user: User,
  ): Promise<paginationData<ShoppingList>> {
    const offset = this.pagination.getOffset(dto.page, dto.limit);
    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);

    const [lists, total] = await this.repository.findAllByUser(
      user.id,
      familyGroupIds,
      offset,
      dto.limit,
      dto.status,
    );

    return this.pagination.paginateData<ShoppingList>(
      lists,
      dto.page,
      dto.limit,
      total,
      this.url,
    );
  }

  async findOne(listId: string, user: User): Promise<ShoppingList> {
    const list = await this.repository.findListWithItems(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    return list;
  }

  toDetailResponseDto(list: ShoppingList): ShoppingListDetailResponseDto {
    const items = list.items ?? [];
    const itemsByCategory: Record<string, unknown[]> = {};

    for (const item of items) {
      const categoryName = item.group?.name ?? 'Sem categoria';
      if (!itemsByCategory[categoryName]) {
        itemsByCategory[categoryName] = [];
      }
      const itemDto = this.responseService.mapToDto(
        ShoppingListItemResponseDto,
        item,
      );
      itemsByCategory[categoryName].push(instanceToPlain(itemDto));
    }

    return this.responseService.mapToDto(ShoppingListDetailResponseDto, {
      id: list.id,
      name: list.name,
      status: list.status,
      familyGroup: list.familyGroup
        ? {
            id: list.familyGroup.id,
            name: list.familyGroup.name,
          }
        : null,
      createdBy: list.createdBy
        ? {
            id: list.createdBy.id,
            name: list.createdBy.name,
            profileImage: list.createdBy.profileImage ?? null,
          }
        : null,
      itemsCount: items.length,
      pendingCount: items.filter(
        (i) => i.status === SHOPPING_LIST_ITEM_STATUS.PENDING,
      ).length,
      inCartCount: items.filter(
        (i) => i.status === SHOPPING_LIST_ITEM_STATUS.IN_CART,
      ).length,
      itemsByCategory,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    } as Record<string, unknown>);
  }

  async update(
    listId: string,
    dto: UpdateShoppingListDto,
    user: User,
  ): Promise<ShoppingList> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    return this.repository.updateList(list, dto as Partial<ShoppingList>);
  }

  async delete(listId: string, user: User): Promise<boolean> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    return this.repository.deleteList(listId);
  }

  async complete(listId: string, user: User): Promise<ShoppingList> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    await this.repository.completeAllItems(listId, user.id);

    const updated = await this.repository.updateList(list, {
      status: SHOPPING_LIST_STATUS.COMPLETED,
    } as Partial<ShoppingList>);

    this.shoppingListGateway.emitToList(listId, 'list_completed', {
      listId,
    });

    return updated;
  }

  async addItem(
    listId: string,
    dto: CreateShoppingListItemDto,
    user: User,
  ): Promise<ShoppingListItem> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    if (dto.useTextRecognition === true) {
      const parsed = await this.textRecognitionService.parseShoppingListItem(
        dto.name,
        user,
      );

      const item = await this.repository.createItem(
        list,
        user,
        parsed.name,
        parsed.quantity,
        parsed.unit,
        parsed.groupId,
      );

      const itemDto = this.responseService.mapToDto(
        ShoppingListItemResponseDto,
        item,
      );
      this.shoppingListGateway.emitToList(listId, 'item_added', itemDto);

      return item;
    }

    let groupId = dto.groupId;

    if (groupId) {
      await this.assertGroupBelongsToUser(groupId, user);
    } else {
      groupId = await this.inferGroupId(dto.name, user);
    }

    const item = await this.repository.createItem(
      list,
      user,
      dto.name,
      dto.quantity ?? 1,
      dto.unit ?? 'un',
      groupId,
    );

    const itemDto = this.responseService.mapToDto(
      ShoppingListItemResponseDto,
      item,
    );
    this.shoppingListGateway.emitToList(listId, 'item_added', itemDto);

    return item;
  }

  async updateItem(
    itemId: string,
    dto: UpdateShoppingListItemDto,
    user: User,
  ): Promise<ShoppingListItem> {
    const item = await this.repository.findItemById(itemId);

    if (!item) {
      throw new NotExistException();
    }

    await this.validateListAccess(item.shoppingList, user.id);

    const updateData: Partial<ShoppingListItem> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === SHOPPING_LIST_ITEM_STATUS.IN_CART) {
        updateData.checkedBy = user;
      } else {
        updateData.checkedBy = null;
      }
    }
    if (dto.groupId !== undefined) {
      await this.assertGroupBelongsToUser(dto.groupId, user);
      updateData.group = { id: dto.groupId } as any;
    }

    const updated = await this.repository.updateItem(item, updateData);

    const itemDto = this.responseService.mapToDto(
      ShoppingListItemResponseDto,
      updated,
    );
    this.shoppingListGateway.emitToList(
      item.shoppingList.id,
      'item_updated',
      itemDto,
    );

    return updated;
  }

  async toggleItem(itemId: string, user: User): Promise<ShoppingListItem> {
    const item = await this.repository.findItemById(itemId);

    if (!item) {
      throw new NotExistException();
    }

    await this.validateListAccess(item.shoppingList, user.id);

    const newStatus: ShoppingListItemStatus =
      item.status === SHOPPING_LIST_ITEM_STATUS.PENDING
        ? SHOPPING_LIST_ITEM_STATUS.IN_CART
        : SHOPPING_LIST_ITEM_STATUS.PENDING;

    const updateData: Partial<ShoppingListItem> = {
      status: newStatus,
      checkedBy: newStatus === SHOPPING_LIST_ITEM_STATUS.IN_CART ? user : null,
    };

    const updated = await this.repository.updateItem(item, updateData);

    const itemDto = this.responseService.mapToDto(
      ShoppingListItemResponseDto,
      updated,
    );
    this.shoppingListGateway.emitToList(
      item.shoppingList.id,
      'item_toggled',
      itemDto,
    );

    return updated;
  }

  async deleteItem(
    itemId: string,
    user: User,
  ): Promise<{ deleted: boolean; listId: string }> {
    const item = await this.repository.findItemById(itemId);

    if (!item) {
      throw new NotExistException();
    }

    await this.validateListAccess(item.shoppingList, user.id);

    const listId = item.shoppingList.id;
    const deleted = await this.repository.deleteItem(itemId);

    if (deleted) {
      this.shoppingListGateway.emitToList(listId, 'item_removed', { itemId });
    }

    return { deleted, listId };
  }

  async getSuggestions(
    search: string,
    user: User,
  ): Promise<
    {
      name: string;
      suggestedGroup: string | null;
      suggestedUnit: string | null;
      frequency: number;
    }[]
  > {
    const userIds = await this.familyGroupService.getAcceptedMemberUserIds(
      user.id,
    );

    const suggestions = await this.repository.findSuggestions(userIds, search);

    return suggestions.map((s) => ({
      name: s.name,
      suggestedGroup: s.groupName,
      suggestedUnit:
        s.unit != null && String(s.unit).trim() !== ''
          ? normalizeShoppingListItemUnit(s.unit)
          : null,
      frequency: s.frequency,
    }));
  }

  async getActiveLists(user: User): Promise<ShoppingList[]> {
    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);
    const [lists] = await this.repository.findAllByUser(
      user.id,
      familyGroupIds,
      0,
      this.MAX_ACTIVE_LISTS_FOR_VOICE,
      SHOPPING_LIST_STATUS.ACTIVE,
    );
    return lists;
  }

  async addItemFromAlexaToList(
    user: User,
    listId: string,
    text: string,
  ): Promise<ShoppingListItem> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      throw new NotExistException();
    }

    await this.validateListAccess(list, user.id);

    const parsed = this.parseAlexaText(text);
    const groupId = await this.inferGroupId(parsed.name, user);

    const item = await this.repository.createItem(
      list,
      user,
      parsed.name,
      parsed.quantity,
      parsed.unit,
      groupId,
    );

    const itemDto = this.responseService.mapToDto(
      ShoppingListItemResponseDto,
      item,
    );
    this.shoppingListGateway.emitToList(list.id, 'item_added', itemDto);

    return item;
  }

  async addItemFromAlexa(user: User, text: string): Promise<ShoppingListItem> {
    const parsed = this.parseAlexaText(text);

    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);
    let list = await this.repository.findActiveListByUser(
      user.id,
      familyGroupIds,
    );

    if (!list) {
      list = await this.repository.createList('Lista de Compras', user);
    }

    const groupId: string | undefined = await this.inferGroupId(
      parsed.name,
      user,
    );

    const item = await this.repository.createItem(
      list,
      user,
      parsed.name,
      parsed.quantity,
      parsed.unit,
      groupId,
    );

    const itemDto = this.responseService.mapToDto(
      ShoppingListItemResponseDto,
      item,
    );
    this.shoppingListGateway.emitToList(list.id, 'item_added', itemDto);

    return item;
  }

  async removeItemByNameFromList(
    user: User,
    listId: string,
    name: string,
  ): Promise<boolean> {
    const list = await this.repository.findListById(listId);

    if (!list) {
      return false;
    }

    await this.validateListAccess(list, user.id);

    const item = await this.repository.findItemByNameInList(list.id, name);

    if (!item) {
      return false;
    }

    const deleted = await this.repository.deleteItem(item.id);

    if (deleted) {
      this.shoppingListGateway.emitToList(list.id, 'item_removed', {
        itemId: item.id,
      });
    }

    return deleted;
  }

  async removeItemByName(user: User, name: string): Promise<boolean> {
    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);
    const list = await this.repository.findActiveListByUser(
      user.id,
      familyGroupIds,
    );

    if (!list) {
      return false;
    }

    const item = await this.repository.findItemByNameInList(list.id, name);

    if (!item) {
      return false;
    }

    const deleted = await this.repository.deleteItem(item.id);

    if (deleted) {
      this.shoppingListGateway.emitToList(list.id, 'item_removed', {
        itemId: item.id,
      });
    }

    return deleted;
  }

  async getActiveListItems(user: User): Promise<ShoppingListItem[]> {
    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);
    const list = await this.repository.findActiveListByUser(
      user.id,
      familyGroupIds,
    );

    if (!list) {
      return [];
    }

    const listWithItems = await this.repository.findListWithItems(list.id);

    return listWithItems?.items ?? [];
  }

  private parseAlexaText(text: string): {
    name: string;
    quantity: number;
    unit: string;
  } {
    const normalized = text.trim().toLowerCase();

    const unitMap: Record<string, string> = {
      unidade: 'un',
      unidades: 'un',
      quilo: 'kg',
      quilos: 'kg',
      kg: 'kg',
      grama: 'g',
      gramas: 'g',
      litro: 'l',
      litros: 'l',
      ml: 'ml',
      mililitro: 'ml',
      mililitros: 'ml',
      pacote: 'pack',
      pacotes: 'pack',
      duzia: 'dz',
      duzias: 'dz',
    };

    const match = normalized.match(
      /^(\d+(?:[.,]\d+)?)\s*(unidades?|quilos?|kg|gramas?|litros?|ml|mililitros?|pacotes?|duzias?|g|l)?\s*(?:de\s+)?(.+)$/,
    );

    if (match) {
      const quantity = parseFloat(match[1].replace(',', '.'));
      const unitText = match[2] || '';
      const unit = unitMap[unitText] || 'un';
      const name = match[3].trim();

      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        quantity,
        unit,
      };
    }

    return {
      name: text.charAt(0).toUpperCase() + text.slice(1).trim(),
      quantity: 1,
      unit: 'un',
    };
  }

  private async inferGroupId(
    itemName: string,
    user: User,
  ): Promise<string | undefined> {
    try {
      const groupName = await this.expenseService.getGroupNameByItemName(
        itemName,
      );

      if (groupName && groupName !== 'Alimentação') {
        const group = await this.groupService.findByName(groupName, user);
        return group?.id;
      }

      const group = await this.groupService.findByName('Alimentação', user);
      return group?.id;
    } catch {
      return undefined;
    }
  }

  private async assertGroupBelongsToUser(
    groupId: string,
    user: User,
  ): Promise<void> {
    const group = await this.groupService.findByIdForUser(groupId, user);

    if (!group) {
      throw new ForbiddenException(
        'Categoria inválida ou não pertence a você.',
      );
    }
  }

  private async validateFamilyGroupAccess(
    familyGroupId: string,
    userId: string,
  ) {
    return this.familyGroupService.findGroupById(familyGroupId, userId);
  }

  private async validateListAccess(
    list: ShoppingList,
    userId: string,
  ): Promise<void> {
    const familyGroupId = list.familyGroup?.id ?? null;

    if (!familyGroupId) {
      if (list.createdBy?.id !== userId) {
        throw new ForbiddenException('Você não tem acesso a esta lista.');
      }
      return;
    }

    const userFamilyGroupIds = await this.getUserFamilyGroupIds(userId);

    if (!userFamilyGroupIds.includes(familyGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta lista.');
    }
  }

  private async getUserFamilyGroupIds(userId: string): Promise<string[]> {
    try {
      const groups = await this.familyGroupService.findGroupsByUser(userId);
      return groups.map((g) => g.id);
    } catch {
      return [];
    }
  }
}
