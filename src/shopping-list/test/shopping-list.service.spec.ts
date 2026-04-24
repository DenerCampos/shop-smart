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
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let repository: jest.Mocked<Pick<IShoppingListRepository, 'createList'>>;

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

  beforeEach(async () => {
    repository = {
      createList: jest.fn(),
    };

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
        { provide: ShoppingListGateway, useValue: {} },
        { provide: TextRecognitionService, useValue: {} },
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
});
