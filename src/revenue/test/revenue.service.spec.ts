import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { RevenueService } from '../revenue.service';
import { IRevenueRepository } from '../interface/revenue.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { CoinService } from '../../coin/coin.service';
import { FamilyMemberResolverService } from '../../common/family-member-resolver/family-member-resolver.service';
import { QueryRunnerFactory } from '../../common/query-runner/queryRunner.factory';
import { InstallmentPlannerService } from '../../common/installment/installment-planner.service';
import { User } from '../../user/entities/user.entity';
import { Revenue } from '../entities/revenue.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { createQueryRunnerFactoryMock } from '../../common/test/query-runner-factory.mock';
import { FILE_STORAGE } from '../../file-storage/file-storage.constants';

describe('RevenueService', () => {
  let service: RevenueService;
  let revenueRepository: jest.Mocked<
    Pick<IRevenueRepository, 'create' | 'findAll'>
  >;
  let coinService: jest.Mocked<Pick<CoinService, 'addCoins'>>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter, 'emit'>>;

  const user = (): User => {
    const u = new User();
    u.id = 'u1';
    u.email = 'a@t.l';
    u.name = 'n';
    u.family = 'f';
    u.coatOfArms = '/c';
    u.password = 'p';
    return u;
  };

  beforeEach(async () => {
    revenueRepository = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([[], 0]),
    };
    coinService = { addCoins: jest.fn().mockResolvedValue(undefined) };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueService,
        { provide: 'IRevenueRepository', useValue: revenueRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: CoinService, useValue: coinService },
        { provide: EVENT_EMITTER, useValue: eventEmitter },
        {
          provide: FamilyMemberResolverService,
          useValue: {
            resolve: jest.fn().mockResolvedValue({
              userIds: ['u1'],
              isAdmin: false,
              groupId: null,
            }),
          },
        },
        { provide: QueryRunnerFactory, useValue: createQueryRunnerFactoryMock() },
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
            mergeInstallmentFields: jest
              .fn()
              .mockImplementation((base: Record<string, unknown>) => base),
          },
        },
        { provide: FILE_STORAGE, useValue: { upload: jest.fn(), delete: jest.fn() } },
      ],
    }).compile();

    service = module.get(RevenueService);
  });

  it('create persiste receita e dispara addCoins', async () => {
    const rev = new Revenue();
    rev.id = 'r1';
    revenueRepository.create.mockResolvedValue(rev);

    const dto = { value: 100, description: 'd' } as any;
    const result = await service.create(user(), dto);

    expect(result).toBe(rev);
    expect(revenueRepository.create).toHaveBeenCalled();
    expect(coinService.addCoins).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('revenue.created', {
      userId: 'u1',
    });
  });

  it('findAll repassa userIds do resolver', async () => {
    await service.findAll({ page: 1, limit: 10 } as any, user());

    expect(revenueRepository.findAll).toHaveBeenCalledWith(
      ['u1'],
      expect.any(Number),
      10,
      undefined,
      undefined,
      undefined,
    );
  });
});
