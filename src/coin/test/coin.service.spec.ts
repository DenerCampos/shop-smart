import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter } from 'events';
import { CoinService } from '../coin.service';
import { ICoinRepository } from '../interface/coin.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { QueryRunnerFactory } from '../../common/query-runner/queryRunner.factory';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { Coin } from '../entities/coin.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { createQueryRunnerFactoryMock } from '../../common/test/query-runner-factory.mock';
import { createTestUser } from '../../common/test/user.fixture';
import { NotExistException } from 'src/exception/notExistException';
import { InsufficientResourceException } from 'src/exception/insufficientResourceException';
import { FamilyMemberResolverService } from '../../common/family-member-resolver/family-member-resolver.service';
import { TransactionType } from '../types/coinType';

describe('CoinService', () => {
  let service: CoinService;
  let coinRepository: jest.Mocked<ICoinRepository>;
  let queryRunnerFactory: ReturnType<typeof createQueryRunnerFactoryMock>;
  let familyMemberResolver: {
    getAcceptedMemberUserIdsIfAdmin: jest.Mock;
    getAcceptedMemberUserIds: jest.Mock;
  };

  beforeEach(async () => {
    coinRepository = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
      findWithUser: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      createTransaction: jest.fn(),
      findStatementPage: jest.fn().mockResolvedValue([[], 0]),
      getStatementTotals: jest.fn().mockResolvedValue({
        totalEarned: 0,
        totalSpent: 0,
      }),
      countAll: jest.fn(),
    };
    queryRunnerFactory = createQueryRunnerFactoryMock();
    familyMemberResolver = {
      getAcceptedMemberUserIdsIfAdmin: jest.fn().mockResolvedValue(['user-1']),
      getAcceptedMemberUserIds: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinService,
        { provide: 'ICoinRepository', useValue: coinRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: QueryRunnerFactory, useValue: queryRunnerFactory },
        { provide: EVENT_EMITTER, useValue: new EventEmitter() },
        {
          provide: FamilyMemberResolverService,
          useValue: familyMemberResolver,
        },
      ],
    }).compile();

    service = module.get(CoinService);
  });

  it('find delega ao repositório', async () => {
    const c = new Coin();
    c.id = 'c1';
    coinRepository.find.mockResolvedValue(c);

    const result = await service.find('c1');

    expect(result).toBe(c);
    expect(coinRepository.find).toHaveBeenCalledWith('c1');
  });

  it('findAndValidateOwnership lança NotExistException quando moeda não existe', async () => {
    coinRepository.findWithUser.mockResolvedValue(null);
    await expect(
      service.findAndValidateOwnership('x', 'user-1'),
    ).rejects.toBeInstanceOf(NotExistException);
  });

  it('findAndValidateOwnership lança ForbiddenException para outro usuário', async () => {
    const c = new Coin();
    c.user = createTestUser({ id: 'owner' });
    coinRepository.findWithUser.mockResolvedValue(c);
    await expect(
      service.findAndValidateOwnership('c1', 'other'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAndValidateOwnership retorna moeda quando dono confere', async () => {
    const u = createTestUser({ id: 'same' });
    const c = new Coin();
    c.user = u;
    coinRepository.findWithUser.mockResolvedValue(c);
    await expect(service.findAndValidateOwnership('c1', 'same')).resolves.toBe(
      c,
    );
  });

  it('update lança NotExistException quando moeda não existe', async () => {
    coinRepository.find.mockResolvedValue(null);
    await expect(
      service.update('c1', { balance: 1 } as never),
    ).rejects.toBeInstanceOf(NotExistException);
  });

  it('update usa moeda existente quando passada', async () => {
    const c = new Coin();
    c.id = 'c1';
    coinRepository.update.mockResolvedValue(c);
    const out = await service.update('c1', { balance: 10 } as never, c);
    expect(out).toBe(c);
    expect(coinRepository.find).not.toHaveBeenCalled();
  });

  it('remove e delete delegam ao repositório', async () => {
    const c = new Coin();
    coinRepository.remove.mockResolvedValue(c);
    coinRepository.delete.mockResolvedValue(true);
    await expect(service.remove('c1')).resolves.toBe(c);
    await expect(service.delete('c1')).resolves.toBe(true);
  });

  it('getUserCoins e getCoinsByUser retornam saldo ou zero', async () => {
    const coin = new Coin();
    coin.balance = 42;
    coinRepository.findByUserId.mockResolvedValue(coin);
    await expect(service.getUserCoins('u1')).resolves.toBe(42);
    await expect(
      service.getCoinsByUser(createTestUser({ id: 'u1' })),
    ).resolves.toBe(42);
    coinRepository.findByUserId.mockResolvedValue(null);
    await expect(service.getUserCoins('u1')).resolves.toBe(0);
  });

  it('findAll monta paginação', async () => {
    const list = new Coin();
    coinRepository.findAll.mockResolvedValue([[list], 1]);
    const result = await service.findAll(
      { page: 1, limit: 10 } as never,
      'user-1',
    );
    expect(result.data).toEqual([list]);
    expect(result.meta.totalItems).toBe(1);
    expect(coinRepository.findAll).toHaveBeenCalledWith(0, 10, 'user-1');
  });

  it('addCoins cria moeda e transação em transação bem-sucedida', async () => {
    const user = createTestUser();
    coinRepository.findByUserId.mockResolvedValue(null);
    const created = new Coin();
    created.id = 'new';
    created.balance = 10;
    coinRepository.create.mockResolvedValue(created);
    coinRepository.update.mockResolvedValue(created);

    const out = await service.addCoins(user, { type: 'revenue' });

    expect(queryRunnerFactory.startTransaction).toHaveBeenCalled();
    expect(queryRunnerFactory.commitTransaction).toHaveBeenCalled();
    expect(out).toBe(created);
  });

  it('removeCoins lança quando usuário não tem moedas', async () => {
    coinRepository.findByUserId.mockResolvedValue(null);
    await expect(
      service.removeCoins(createTestUser(), { type: 'theme' }),
    ).rejects.toBeInstanceOf(NotExistException);
  });

  it('removeCoins lança quando saldo insuficiente', async () => {
    const c = new Coin();
    c.balance = 10;
    coinRepository.findByUserId.mockResolvedValue(c);
    await expect(
      service.removeCoins(createTestUser(), { type: 'theme' }),
    ).rejects.toBeInstanceOf(InsufficientResourceException);
  });

  it('removeCoins debita quando há saldo', async () => {
    const user = createTestUser();
    const c = new Coin();
    c.balance = 1000;
    c.totalEarned = 1000;
    c.totalSpent = 0;
    coinRepository.findByUserId.mockResolvedValue(c);
    coinRepository.update.mockResolvedValue(c);

    await service.removeCoins(user, { type: 'color' });

    expect(queryRunnerFactory.commitTransaction).toHaveBeenCalled();
  });

  it('getStatement — resolve userIds via admin e monta resposta paginada', async () => {
    const user = createTestUser({ id: 'user-1' });
    const row = {
      id: 'tx-1',
      amount: 5,
      transactionType: TransactionType.EARN,
      description: 'Cupom',
      balanceBefore: 0,
      balanceAfter: 5,
      createdAt: new Date('2024-06-01T12:00:00.000Z'),
      userId: 'user-1',
      userName: 'Test',
    };

    coinRepository.findStatementPage.mockResolvedValue([[row], 1]);
    coinRepository.getStatementTotals.mockResolvedValue({
      totalEarned: 5,
      totalSpent: 0,
    });

    const result = await service.getStatement(user, {
      startDate: '2024-06-01 00:00:00',
      endDate: '2024-06-30 23:59:59',
      page: 1,
      limit: 20,
    });

    expect(
      familyMemberResolver.getAcceptedMemberUserIdsIfAdmin,
    ).toHaveBeenCalledWith('user-1');
    expect(coinRepository.findStatementPage).toHaveBeenCalledWith(
      ['user-1'],
      '2024-06-01 00:00:00',
      '2024-06-30 23:59:59',
      0,
      20,
    );
    expect(result.totals).toEqual({ totalEarned: 5, totalSpent: 0 });
    expect(result.data).toEqual([row]);
    expect(result.meta.totalItems).toBe(1);
  });

  it('getStatement — userId=all usa todos os membros aceitos', async () => {
    const user = createTestUser({ id: 'user-1' });

    await service.getStatement(user, {
      startDate: '2024-06-01 00:00:00',
      endDate: '2024-06-30 23:59:59',
      userId: 'all',
    });

    expect(familyMemberResolver.getAcceptedMemberUserIds).toHaveBeenCalledWith(
      'user-1',
    );
    expect(coinRepository.findStatementPage).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      expect.any(String),
      expect.any(String),
      0,
      20,
    );
  });

  it('getStatement — userId específico permitido quando membro da família', async () => {
    const user = createTestUser({ id: 'user-1' });

    await service.getStatement(user, {
      startDate: '2024-06-01 00:00:00',
      endDate: '2024-06-30 23:59:59',
      userId: 'user-2',
    });

    expect(coinRepository.findStatementPage).toHaveBeenCalledWith(
      ['user-2'],
      expect.any(String),
      expect.any(String),
      0,
      20,
    );
  });

  it('getStatement — ForbiddenException para userId fora da família', async () => {
    const user = createTestUser({ id: 'user-1' });

    await expect(
      service.getStatement(user, {
        startDate: '2024-06-01 00:00:00',
        endDate: '2024-06-30 23:59:59',
        userId: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(coinRepository.findStatementPage).not.toHaveBeenCalled();
  });
});
