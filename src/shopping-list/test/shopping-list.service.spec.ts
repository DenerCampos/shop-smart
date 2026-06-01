import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListService } from '../shopping-list.service';
import { IShoppingListRepository } from '../interfaces/shopping-list.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { ExpenseService } from '../../expense/expense.service';
import { GroupService } from '../../group/group.service';
import { ResponseService } from '../../common/response/response';
import { ShoppingListGateway } from '../shopping-list.gateway';
import { TextRecognitionService } from '../../text-recognition/textRecognition.service';
import { User } from '../../user/entities/user.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingListItem } from '../entities/shopping-list-item.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { EventEmitter } from 'events';
import { SHOPPING_LIST_STATUS } from '../types/shopping-list-status.type';
import { SHOPPING_LIST_ITEM_STATUS } from '../types/shopping-list-item-status.type';
import { NotExistException } from '../../exception/notExistException';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let repository: jest.Mocked<
    Pick<
      IShoppingListRepository,
      | 'createList'
      | 'findListById'
      | 'findListWithItems'
      | 'completeAllItems'
      | 'updateList'
      | 'finalizeWithRemainingAndBranch'
      | 'recreateFromCompleted'
    >
  >;
  let gateway: { emitToList: jest.Mock };
  let eventEmitter: EventEmitter;

  const user = (): User => {
    const u = new User();
    u.id = 'u1';
    u.email = 'e@t.l';
    u.name = 'n';
    u.family = 'f';
    u.coatOfArms = '/c';
    u.password = 'p';
    return u;
  };

  const activeList = (overrides: Partial<ShoppingList> = {}): ShoppingList =>
    ({
      id: 'l1',
      name: 'Compras',
      status: SHOPPING_LIST_STATUS.ACTIVE,
      createdBy: user(),
      items: [],
      ...overrides,
    }) as ShoppingList;

  const item = (
    name: string,
    status: (typeof SHOPPING_LIST_ITEM_STATUS)[keyof typeof SHOPPING_LIST_ITEM_STATUS],
  ): ShoppingListItem =>
    ({
      id: `${name}-id`,
      name,
      status,
      quantity: 1,
      unit: 'un',
    }) as ShoppingListItem;

  beforeEach(async () => {
    repository = {
      createList: jest.fn(),
      findListById: jest.fn(),
      findListWithItems: jest.fn(),
      completeAllItems: jest.fn(),
      updateList: jest.fn(),
      finalizeWithRemainingAndBranch: jest.fn(),
      recreateFromCompleted: jest.fn(),
    };

    gateway = { emitToList: jest.fn() };
    eventEmitter = new EventEmitter();
    jest.spyOn(eventEmitter, 'emit');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListService,
        { provide: 'IShoppingListRepository', useValue: repository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: FamilyGroupService, useValue: {} },
        { provide: ExpenseService, useValue: {} },
        { provide: GroupService, useValue: {} },
        { provide: ResponseService, useValue: {} },
        { provide: ShoppingListGateway, useValue: gateway },
        { provide: TextRecognitionService, useValue: {} },
        { provide: EVENT_EMITTER, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ShoppingListService);
  });

  it('create chama createList sem grupo quando familyGroupId ausente', async () => {
    const list = new ShoppingList();
    list.id = 'l1';
    repository.createList.mockResolvedValue(list);

    const result = await service.create({ name: 'Compras' } as any, user());

    expect(result).toBe(list);
    expect(repository.createList).toHaveBeenCalledWith('Compras', user(), null);
  });

  describe('complete', () => {
    it('lança NotExistException quando lista não existe', async () => {
      repository.findListById.mockResolvedValue(null);

      await expect(service.complete('l1', user())).rejects.toBeInstanceOf(
        NotExistException,
      );
    });

    it('lança BadRequestException quando lista não está active', async () => {
      repository.findListById.mockResolvedValue(
        activeList({ status: SHOPPING_LIST_STATUS.COMPLETED }),
      );

      await expect(service.complete('l1', user())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('finaliza lista active', async () => {
      const list = activeList();
      const updated = activeList({ status: SHOPPING_LIST_STATUS.COMPLETED });
      repository.findListById.mockResolvedValue(list);
      repository.updateList.mockResolvedValue(updated);

      const result = await service.complete('l1', user());

      expect(repository.completeAllItems).toHaveBeenCalledWith('l1', 'u1');
      expect(repository.updateList).toHaveBeenCalledWith(list, {
        status: SHOPPING_LIST_STATUS.COMPLETED,
      });
      expect(gateway.emitToList).toHaveBeenCalledWith('l1', 'list_completed', {
        listId: 'l1',
      });
      expect(result).toBe(updated);
    });
  });

  describe('completeWithRemaining', () => {
    it('lança BadRequestException sem itens pendentes', async () => {
      repository.findListWithItems.mockResolvedValue(
        activeList({
          items: [item('Arroz', SHOPPING_LIST_ITEM_STATUS.IN_CART)],
        }),
      );

      await expect(
        service.completeWithRemaining('l1', user()),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException sem itens in_cart', async () => {
      repository.findListWithItems.mockResolvedValue(
        activeList({
          items: [item('Feijão', SHOPPING_LIST_ITEM_STATUS.PENDING)],
        }),
      );

      await expect(
        service.completeWithRemaining('l1', user()),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando lista não está active', async () => {
      repository.findListWithItems.mockResolvedValue(
        activeList({
          status: SHOPPING_LIST_STATUS.COMPLETED,
          items: [
            item('Arroz', SHOPPING_LIST_ITEM_STATUS.IN_CART),
            item('Feijão', SHOPPING_LIST_ITEM_STATUS.PENDING),
          ],
        }),
      );

      await expect(
        service.completeWithRemaining('l1', user()),
      ).rejects.toThrow(BadRequestException);
    });

    it('delega persistência ao repository e emite eventos', async () => {
      const pending = item('Leite', SHOPPING_LIST_ITEM_STATUS.PENDING);
      const list = activeList({
        items: [
          item('Arroz', SHOPPING_LIST_ITEM_STATUS.IN_CART),
          pending,
        ],
      });
      const completed = activeList({ id: 'l1', status: SHOPPING_LIST_STATUS.COMPLETED });
      const newList = activeList({
        id: 'l2',
        items: [pending],
      });

      repository.findListWithItems.mockResolvedValue(list);
      repository.finalizeWithRemainingAndBranch.mockResolvedValue({
        completed,
        newList,
      });

      const result = await service.completeWithRemaining('l1', user());

      expect(repository.finalizeWithRemainingAndBranch).toHaveBeenCalledWith(
        list,
        user(),
        [pending],
      );
      expect(gateway.emitToList).toHaveBeenCalledWith('l1', 'list_completed', {
        listId: 'l1',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('shopping_list.created', {
        userId: 'u1',
      });
      expect(result).toEqual({ completed, newList });
    });
  });

  describe('recreate', () => {
    it('lança BadRequestException quando lista não está completed', async () => {
      repository.findListWithItems.mockResolvedValue(activeList());

      await expect(service.recreate('l1', user())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('delega persistência ao repository e emite evento', async () => {
      const list = activeList({
        status: SHOPPING_LIST_STATUS.COMPLETED,
        items: [item('Arroz', SHOPPING_LIST_ITEM_STATUS.IN_CART)],
      });
      const newList = activeList({
        id: 'l2',
        items: [item('Arroz', SHOPPING_LIST_ITEM_STATUS.PENDING)],
      });

      repository.findListWithItems.mockResolvedValue(list);
      repository.recreateFromCompleted.mockResolvedValue(newList);

      const result = await service.recreate('l1', user());

      expect(repository.recreateFromCompleted).toHaveBeenCalledWith(
        list,
        user(),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('shopping_list.created', {
        userId: 'u1',
      });
      expect(result).toBe(newList);
    });
  });
});
