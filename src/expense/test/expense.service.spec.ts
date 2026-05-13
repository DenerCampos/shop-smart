import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from '../expense.service';
import { IExpenseRepository } from '../interface/expense.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { StoreService } from '../../store/store.service';
import { PaymentService } from '../../payment/payment.service';
import { GroupService } from '../../group/group.service';
import { CoinService } from '../../coin/coin.service';
import { QueryRunnerFactory } from '../../common/query-runner/queryRunner.factory';
import { FamilyMemberResolverService } from '../../common/family-member-resolver/family-member-resolver.service';
import { User } from '../../user/entities/user.entity';
import { Store } from '../../store/entities/store.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { createQueryRunnerFactoryMock } from '../../common/test/query-runner-factory.mock';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let expenseRepository: jest.Mocked<
    Pick<IExpenseRepository, 'findAll' | 'find'>
  >;
  let storeService: jest.Mocked<Pick<StoreService, 'findByName' | 'create'>>;
  let familyMemberResolver: jest.Mocked<
    Pick<FamilyMemberResolverService, 'resolve'>
  >;

  const user = (): User => {
    const u = new User();
    u.id = 'user-1';
    u.email = 'e@test.local';
    u.name = 'U';
    u.family = 'F';
    u.coatOfArms = '/c.png';
    u.password = 'x';
    return u;
  };

  beforeEach(async () => {
    expenseRepository = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
    };
    storeService = {
      findByName: jest.fn(),
      create: jest.fn(),
    };
    const paymentService = {
      create: jest.fn(),
      findByName: jest.fn(),
    };
    const groupService = {
      create: jest.fn(),
      findByName: jest.fn(),
    };
    const coinService = { addCoins: jest.fn().mockResolvedValue(undefined) };
    familyMemberResolver = {
      resolve: jest.fn().mockResolvedValue({
        userIds: ['user-1'],
        isAdmin: false,
        groupId: null,
        groupName: null,
      }),
    };
    const qrf = createQueryRunnerFactoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: 'IExpenseRepository', useValue: expenseRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: StoreService, useValue: storeService },
        { provide: PaymentService, useValue: paymentService },
        { provide: GroupService, useValue: groupService },
        { provide: CoinService, useValue: coinService },
        { provide: QueryRunnerFactory, useValue: qrf },
        {
          provide: FamilyMemberResolverService,
          useValue: familyMemberResolver,
        },
      ],
    }).compile();

    service = module.get(ExpenseService);
  });

  describe('findAll', () => {
    it('usa userIds do FamilyMemberResolver e repassa ao repositório', async () => {
      await service.findAll({ page: 1, limit: 5, search: 'x' } as any, user());

      expect(familyMemberResolver.resolve).toHaveBeenCalledWith('user-1');
      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        ['user-1'],
        expect.any(Number),
        5,
        'x',
        undefined,
      );
    });
  });

  describe('findOrCreateStore', () => {
    it('retorna loja existente quando findByName encontra', async () => {
      const s = new Store();
      s.id = 'st1';
      s.name = 'Loja';
      storeService.findByName.mockResolvedValue(s);

      const result = await service.findOrCreateStore('Loja', user());

      expect(result).toBe(s);
      expect(storeService.create).not.toHaveBeenCalled();
    });

    it('cria loja quando não existe', async () => {
      storeService.findByName.mockResolvedValue(null);
      const created = new Store();
      created.id = 'new';
      created.name = 'Nova';
      storeService.create.mockResolvedValue(created);

      const result = await service.findOrCreateStore('Nova', user());

      expect(storeService.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });
});
