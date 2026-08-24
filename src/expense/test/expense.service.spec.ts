import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
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
import { InstallmentPlannerService } from '../../common/installment/installment-planner.service';
import { User } from '../../user/entities/user.entity';
import { Store } from '../../store/entities/store.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Expense } from '../entities/expense.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { createQueryRunnerFactoryMock } from '../../common/test/query-runner-factory.mock';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';
import { FILE_STORAGE } from '../../file-storage/file-storage.constants';
import { NotExistException } from '../../exception/notExistException';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let expenseRepository: jest.Mocked<
    Pick<IExpenseRepository, 'findAll' | 'find' | 'findByInstallmentGroup'>
  >;
  let storeService: jest.Mocked<Pick<StoreService, 'findByName' | 'create'>>;
  let familyMemberResolver: jest.Mocked<
    Pick<FamilyMemberResolverService, 'resolve' | 'assertAdminManagingTarget'>
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
      findByInstallmentGroup: jest.fn().mockResolvedValue([]),
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
      }),
      assertAdminManagingTarget: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: InstallmentPlannerService,
          useValue: {
            isFiniteInstallment: jest.fn().mockReturnValue(false),
            resolveMeta: jest.fn().mockReturnValue({
              installmentGroupId: null,
              installmentNumber: null,
              totalInstallments: null,
              isInstallment: false,
              repeat: false,
            }),
          },
        },
        {
          provide: FILE_STORAGE,
          useValue: { upload: jest.fn(), delete: jest.fn() },
        },
        provideEventEmitterMock(),
      ],
    }).compile();

    service = module.get(ExpenseService);
  });

  describe('findAll', () => {
    it('usa userIds do FamilyMemberResolver e repassa ao repositório', async () => {
      await service.findAll({ page: 1, limit: 5, search: 'x' } as any, user());

      expect(familyMemberResolver.resolve).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        ['user-1'],
        expect.any(Number),
        5,
        'x',
        undefined,
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

  describe('getReceipt', () => {
    const owner = (): User => {
      const u = user();
      u.id = 'owner-1';
      return u;
    };

    const stubExpense = (): Expense => {
      const expense = new Expense();
      expense.id = 'exp-1';
      expense.name = 'Mercado';
      expense.value = 10;
      expense.uri = '';
      expense.photos = [];
      expense.items = [];
      expense.date = new Date('2026-08-01');
      expense.isInstallment = false;
      expense.installmentGroupId = null;
      expense.installmentNumber = null;
      expense.totalInstallments = null;
      expense.user = owner();
      expense.store = { name: 'Loja' } as Store;
      expense.payment = { name: 'Pix' } as Payment;
      return expense;
    };

    it('dono visualiza o próprio comprovante', async () => {
      expenseRepository.find.mockResolvedValue(stubExpense());

      const result = await service.getReceipt('exp-1', 'owner-1');

      expect(
        familyMemberResolver.assertAdminManagingTarget,
      ).toHaveBeenCalledWith('owner-1', 'owner-1');
      expect(result.id).toBe('exp-1');
      expect(result.type).toBe('expense');
    });

    it('admin da família visualiza comprovante de outro membro', async () => {
      expenseRepository.find.mockResolvedValue(stubExpense());

      const result = await service.getReceipt('exp-1', 'admin-1');

      expect(
        familyMemberResolver.assertAdminManagingTarget,
      ).toHaveBeenCalledWith('admin-1', 'owner-1');
      expect(result.id).toBe('exp-1');
    });

    it('membro comum não visualiza comprovante alheio', async () => {
      expenseRepository.find.mockResolvedValue(stubExpense());
      familyMemberResolver.assertAdminManagingTarget.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.getReceipt('exp-1', 'member-2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('despesa inexistente lança NotExistException', async () => {
      expenseRepository.find.mockResolvedValue(null);

      await expect(
        service.getReceipt('missing', 'owner-1'),
      ).rejects.toBeInstanceOf(NotExistException);
    });
  });
});
