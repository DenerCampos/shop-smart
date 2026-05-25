import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RecipeService } from '../recipe.service';
import { IRecipeRepository } from '../interfaces/recipe.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { ShoppingListService } from '../../shopping-list/shopping-list.service';
import { FILE_STORAGE } from '../../file-storage/file-storage.constants';
import { IFileStorageService } from '../../file-storage/interfaces/file-storage.interface';
import { User } from '../../user/entities/user.entity';
import { Recipe } from '../entities/recipe.entity';
import { FamilyGroup } from '../../family-group/entities/family-group.entity';
import { NotExistException } from '../../exception/notExistException';
import { ShoppingList } from '../../shopping-list/entities/shopping-list.entity';
import { ShoppingListItem } from '../../shopping-list/entities/shopping-list-item.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';

describe('RecipeService', () => {
  let service: RecipeService;
  let repository: jest.Mocked<IRecipeRepository>;
  let familyGroupService: jest.Mocked<
    Pick<
      FamilyGroupService,
      'findGroupById' | 'findGroupsByUser'
    >
  >;
  let shoppingListService: jest.Mocked<
    Pick<
      ShoppingListService,
      | 'create'
      | 'addBulkItems'
      | 'findOne'
      | 'findByNameAndUser'
      | 'deleteItem'
    >
  >;
  let fileStorage: jest.Mocked<
    Pick<IFileStorageService, 'uploadFile' | 'deleteFile' | 'extractFileIdFromUrl'>
  >;

  const user = (id: string): User => {
    const u = new User();
    u.id = id;
    u.email = `${id}@t.l`;
    u.name = `User ${id}`;
    u.family = 'f';
    u.coatOfArms = '/c';
    u.password = 'p';
    return u;
  };

  const familyGroup = (id: string): FamilyGroup => {
    const g = new FamilyGroup();
    g.id = id;
    g.name = 'Família';
    return g;
  };

  beforeEach(async () => {
    repository = {
      createRecipe: jest.fn(),
      findById: jest.fn(),
      findAllByUser: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    };

    familyGroupService = {
      findGroupById: jest.fn(),
      findGroupsByUser: jest.fn(),
    };

    shoppingListService = {
      create: jest.fn(),
      addBulkItems: jest.fn(),
      findOne: jest.fn(),
      findByNameAndUser: jest.fn(),
      deleteItem: jest.fn(),
    };

    fileStorage = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      extractFileIdFromUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        { provide: 'IRecipeRepository', useValue: repository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: FamilyGroupService, useValue: familyGroupService },
        { provide: ShoppingListService, useValue: shoppingListService },
        { provide: FILE_STORAGE, useValue: fileStorage },
        provideEventEmitterMock(),
      ],
    }).compile();

    service = module.get(RecipeService);
  });

  it('create sem familyGroupId chama createRecipe com familyGroup null', async () => {
    const u = user('u1');
    const saved = new Recipe();
    saved.id = 'r1';
    repository.createRecipe.mockResolvedValue(saved);

    await service.create(
      {
        title: 'Bolo',
        ingredients: [{ name: 'farinha', quantity: 1, unit: 'kg' }],
        instructions: 'Misture',
      } as any,
      u,
    );

    expect(familyGroupService.findGroupById).not.toHaveBeenCalled();
    expect(repository.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bolo',
        familyGroup: null,
        createdBy: u,
      }),
    );
  });

  it('create com familyGroupId valida grupo familiar', async () => {
    const u = user('u1');
    const fg = familyGroup('fg1');
    familyGroupService.findGroupById.mockResolvedValue(fg as any);
    const saved = new Recipe();
    saved.id = 'r1';
    repository.createRecipe.mockResolvedValue(saved);

    await service.create(
      {
        title: 'Sopa',
        ingredients: [{ name: 'cenoura', quantity: 2, unit: 'un' }],
        instructions: 'Cozinhe',
        familyGroupId: 'fg1',
      } as any,
      u,
    );

    expect(familyGroupService.findGroupById).toHaveBeenCalledWith('fg1', 'u1');
    expect(repository.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ familyGroup: fg }),
    );
  });

  it('findAll usa grupos do usuário no repositório', async () => {
    familyGroupService.findGroupsByUser.mockResolvedValue([
      familyGroup('g1'),
    ] as any);
    repository.findAllByUser.mockResolvedValue([[], 0]);

    await service.findAll({ page: 1, limit: 10 } as any, user('u1'));

    expect(repository.findAllByUser).toHaveBeenCalledWith(
      'u1',
      ['g1'],
      0,
      10,
    );
  });

  it('findOne lança NotExistException quando não existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne('missing', user('u1'))).rejects.toBeInstanceOf(
      NotExistException,
    );
  });

  it('findOne lança ForbiddenException para receita individual de outro usuário', async () => {
    const r = new Recipe();
    r.id = 'r1';
    r.createdBy = user('owner');
    r.familyGroup = null;
    repository.findById.mockResolvedValue(r);

    await expect(service.findOne('r1', user('other'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('update lança Forbidden quando usuário não pertence ao grupo', async () => {
    const r = new Recipe();
    r.id = 'r1';
    r.createdBy = user('owner');
    r.familyGroup = familyGroup('fg1');
    repository.findById.mockResolvedValue(r);
    familyGroupService.findGroupsByUser.mockResolvedValue([]);

    await expect(
      service.update('r1', { title: 'X' } as any, user('intruso')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delete lança Forbidden quando não é o criador', async () => {
    const r = new Recipe();
    r.id = 'r1';
    r.createdBy = user('owner');
    r.familyGroup = familyGroup('fg1');
    repository.findById.mockResolvedValue(r);
    familyGroupService.findGroupsByUser.mockResolvedValue([
      familyGroup('fg1'),
    ] as any);

    await expect(service.remove('r1', user('member'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('delete remove fotos do Supabase e faz softRemove quando é o criador', async () => {
    const owner = user('owner');
    const r = new Recipe();
    r.id = 'r1';
    r.createdBy = owner;
    r.familyGroup = familyGroup('fg1');
    r.photos = [
      'https://test.supabase.co/storage/v1/object/public/shop-smart/recipe/abc.png',
    ];
    repository.findById.mockResolvedValue(r);
    familyGroupService.findGroupsByUser.mockResolvedValue([
      familyGroup('fg1'),
    ] as any);
    fileStorage.extractFileIdFromUrl.mockReturnValue('recipe/abc.png');
    repository.softRemove.mockResolvedValue(true);

    const ok = await service.remove('r1', owner);

    expect(ok).toBe(true);
    expect(fileStorage.deleteFile).toHaveBeenCalledWith('recipe/abc.png');
    expect(repository.softRemove).toHaveBeenCalledWith('r1');
  });

  it('generateShoppingList cria lista e chama addBulkItems', async () => {
    const owner = user('u1');
    const r = new Recipe();
    r.id = 'r1';
    r.title = 'Torta';
    r.ingredients = [
      { name: 'açúcar', quantity: 100, unit: 'g' },
      { name: 'farinha', quantity: 200, unit: 'g' },
    ];
    r.familyGroup = null;
    r.createdBy = owner;

    repository.findById.mockResolvedValue(r);
    shoppingListService.findByNameAndUser.mockResolvedValue(null);

    const list = new ShoppingList();
    list.id = 'list1';
    list.items = [];
    shoppingListService.create.mockResolvedValue(list);

    const fullList = new ShoppingList();
    fullList.id = 'list1';
    fullList.items = [];
    shoppingListService.findOne.mockResolvedValue(fullList);

    const result = await service.generateShoppingList('r1', owner);

    expect(shoppingListService.create).toHaveBeenCalledWith(
      {
        name: 'Ingredientes: Torta',
        familyGroupId: undefined,
      },
      owner,
    );
    expect(shoppingListService.addBulkItems).toHaveBeenCalledWith(
      'list1',
      { text: '100 g açúcar, 200 g farinha' },
      owner,
    );
    expect(shoppingListService.findOne).toHaveBeenCalledWith('list1', owner);
    expect(result).toBe(fullList);
  });

  it('generateShoppingList atualiza lista existente removendo itens antigos', async () => {
    const owner = user('u1');
    const r = new Recipe();
    r.id = 'r1';
    r.title = 'Torta';
    r.ingredients = [{ name: 'açúcar', quantity: 100, unit: 'g' }];
    r.familyGroup = null;
    r.createdBy = owner;

    const existing = new ShoppingList();
    existing.id = 'list1';

    const oldItem = new ShoppingListItem();
    oldItem.id = 'item-old';

    const listWithItems = new ShoppingList();
    listWithItems.id = 'list1';
    listWithItems.items = [oldItem];

    const refreshedList = new ShoppingList();
    refreshedList.id = 'list1';
    refreshedList.items = [];

    repository.findById.mockResolvedValue(r);
    shoppingListService.findByNameAndUser.mockResolvedValue(existing);
    shoppingListService.findOne
      .mockResolvedValueOnce(listWithItems)
      .mockResolvedValueOnce(refreshedList);
    shoppingListService.deleteItem.mockResolvedValue({
      deleted: true,
      listId: 'list1',
    });

    const result = await service.generateShoppingList('r1', owner);

    expect(shoppingListService.create).not.toHaveBeenCalled();
    expect(shoppingListService.deleteItem).toHaveBeenCalledWith(
      'item-old',
      owner,
    );
    expect(shoppingListService.addBulkItems).toHaveBeenCalledWith(
      'list1',
      { text: '100 g açúcar' },
      owner,
    );
    expect(result).toBe(refreshedList);
  });
});
