import { BadRequestException, ConflictException } from '@nestjs/common';
import { NotExistException } from 'src/exception/notExistException';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { UserService } from 'src/user/user.service';
import { FILE_STORAGE } from 'src/file-storage/file-storage.constants';
import { CoinService } from 'src/coin/coin.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination } from 'src/common/pagination/pagination';
import { ChoreService } from '../chore.service';
import { ChoreDefinition } from '../entities/chore-definition.entity';
import { ChoreOccurrence } from '../entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from '../entities/chore-payroll-settlement.entity';
import { CHORE_OCCURRENCE_STATUS } from '../types/chore-occurrence-status.type';
import { User } from 'src/user/entities/user.entity';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { IChoreRepository } from '../interface/chore.repository.interface';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';

describe('ChoreService', () => {
  let service: ChoreService;
  let familyGroupService: {
    assertFamilyAdmin: jest.Mock;
    assertAcceptedMembership: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let choreRepository: jest.Mocked<
    Pick<
      IChoreRepository,
      | 'findOccurrenceForStartLocked'
      | 'saveOccurrence'
      | 'findOccurrenceForApproveLocked'
      | 'findDefinitionById'
      | 'findOccurrenceWaitingApproval'
      | 'findPayrollSettlementByGroupAndPeriod'
      | 'findOneOccurrenceVisible'
      | 'insertOpenOccurrence'
      | 'sumPendingCoinRewards'
      | 'celebratePendingCoinRewards'
    >
  >;
  let coinService: { addEarnedCoinsByAmount: jest.Mock };
  let expenseService: { createPayrollExpense: jest.Mock };
  let revenueService: { createPayrollRevenue: jest.Mock };
  let userService: { find: jest.Mock };

  const memberUser = { id: 'u-member', name: 'Filho' } as User;
  const adminUser = { id: 'u-admin', name: 'Pai' } as User;

  beforeEach(async () => {
    familyGroupService = {
      assertFamilyAdmin: jest.fn().mockResolvedValue(undefined),
      assertAcceptedMembership: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(async (fn: (m: unknown) => Promise<unknown>) =>
        fn({}),
      ),
    };

    choreRepository = {
      findOccurrenceForStartLocked: jest.fn(),
      saveOccurrence: jest.fn(),
      findOccurrenceForApproveLocked: jest.fn(),
      findDefinitionById: jest.fn(),
      findOccurrenceWaitingApproval: jest.fn(),
      findPayrollSettlementByGroupAndPeriod: jest.fn(),
      findOneOccurrenceVisible: jest.fn(),
      insertOpenOccurrence: jest.fn(),
      sumPendingCoinRewards: jest.fn(),
      celebratePendingCoinRewards: jest.fn(),
    };

    coinService = {
      addEarnedCoinsByAmount: jest.fn().mockResolvedValue({}),
    };

    expenseService = {
      createPayrollExpense: jest.fn().mockResolvedValue({}),
    };

    revenueService = {
      createPayrollRevenue: jest.fn().mockResolvedValue({}),
    };

    userService = {
      find: jest.fn().mockResolvedValue(memberUser),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChoreService,
        { provide: 'IChoreRepository', useValue: choreRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: FamilyGroupService, useValue: familyGroupService },
        { provide: UserService, useValue: userService },
        { provide: FILE_STORAGE, useValue: { uploadFile: jest.fn() } },
        { provide: CoinService, useValue: coinService },
        { provide: ExpenseService, useValue: expenseService },
        { provide: RevenueService, useValue: revenueService },
        {
          provide: AppConfig,
          useValue: { getBaseUrl: () => 'http://localhost:3000' },
        },
        { provide: Pagination, useValue: new Pagination() },
        provideEventEmitterMock(),
      ],
    }).compile();

    service = moduleRef.get(ChoreService);
  });

  it('startOccurrence — conflito quando status não é OPEN', async () => {
    const locked = {
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.IN_PROGRESS,
      definition: {
        deletedAt: null,
        isActive: true,
        rewardValue: 5,
        coinReward: 2,
      },
    } as ChoreOccurrence;

    choreRepository.findOccurrenceForStartLocked.mockResolvedValue(locked);

    await expect(
      service.startOccurrence('g1', memberUser, 'occ1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(choreRepository.saveOccurrence).not.toHaveBeenCalled();
  });

  it('approveOccurrence — envia tarefa para o mês seguinte se o período já foi liquidado', async () => {
    const now = new Date();
    const approvalPeriodYm = now.getFullYear() * 100 + (now.getMonth() + 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const expectedNextPeriodYm =
      nextMonth.getFullYear() * 100 + (nextMonth.getMonth() + 1);

    const waiting = {
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      assignedTo: memberUser,
      snapshotCoinReward: 7,
      snapshotRewardMoney: 3.5,
      definition: { id: 'def1' },
    } as ChoreOccurrence;

    choreRepository.findOccurrenceForApproveLocked.mockResolvedValue(waiting);
    choreRepository.findPayrollSettlementByGroupAndPeriod.mockResolvedValue({
      id: 'set1',
      periodYm: approvalPeriodYm,
    } as ChorePayrollSettlement);
    choreRepository.saveOccurrence.mockImplementation(async (o) => o);
    choreRepository.findDefinitionById.mockResolvedValue({
      id: 'def1',
      deletedAt: null,
      isActive: true,
      recurrence: 'once',
    } as ChoreDefinition);

    const afterApprove = {
      id: 'occ1',
      status: CHORE_OCCURRENCE_STATUS.COMPLETED,
      assignedTo: memberUser,
      earnedPeriodYm: expectedNextPeriodYm,
      definition: { id: 'def1' },
    } as ChoreOccurrence;

    jest.spyOn(service, 'loadOccurrence').mockResolvedValue(afterApprove);

    await service.approveOccurrence('g1', adminUser, 'occ1');

    expect(choreRepository.saveOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({ earnedPeriodYm: expectedNextPeriodYm }),
      expect.anything(),
    );
  });

  it('approveOccurrence — registra moedas para o executor', async () => {
    choreRepository.findPayrollSettlementByGroupAndPeriod.mockResolvedValue(
      null,
    );
    const waiting = {
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      assignedTo: memberUser,
      snapshotCoinReward: 7,
      snapshotRewardMoney: 3.5,
      definition: { id: 'def1' },
    } as ChoreOccurrence;

    choreRepository.findOccurrenceForApproveLocked.mockResolvedValue(waiting);
    choreRepository.saveOccurrence.mockImplementation(async (o) => o);

    choreRepository.findDefinitionById.mockResolvedValue({
      id: 'def1',
      deletedAt: null,
      isActive: true,
      recurrence: 'once',
    } as ChoreDefinition);

    const afterApprove = {
      id: 'occ1',
      status: CHORE_OCCURRENCE_STATUS.COMPLETED,
      assignedTo: memberUser,
      snapshotCoinReward: 7,
      snapshotRewardMoney: 3.5,
      definition: { id: 'def1' },
    } as ChoreOccurrence;

    jest.spyOn(service, 'loadOccurrence').mockResolvedValue(afterApprove);
    jest
      .spyOn(
        service as unknown as { spawnOpenOccurrence: jest.Mock },
        'spawnOpenOccurrence',
      )
      .mockResolvedValue(undefined);

    await service.approveOccurrence('g1', adminUser, 'occ1');

    expect(coinService.addEarnedCoinsByAmount).toHaveBeenCalledWith(
      memberUser,
      7,
      expect.stringContaining('doméstica'),
    );
    expect(choreRepository.insertOpenOccurrence).not.toHaveBeenCalled();
  });

  it('approveOccurrence — cria próxima ocorrência diária com scheduledDate', async () => {
    const createdAt = new Date(2026, 4, 1, 10, 0, 0);
    const approvedAt = new Date(2026, 4, 2, 10, 0, 0);
    const waiting = {
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      assignedTo: memberUser,
      snapshotCoinReward: 5,
      snapshotRewardMoney: 1,
      definition: { id: 'def1' },
      createdAt,
    } as ChoreOccurrence;

    choreRepository.findOccurrenceForApproveLocked.mockResolvedValue(waiting);
    choreRepository.saveOccurrence.mockImplementation(async (o) => o);
    choreRepository.findDefinitionById.mockResolvedValue({
      id: 'def1',
      deletedAt: null,
      isActive: true,
      recurrence: 'daily',
    } as ChoreDefinition);

    const afterApprove = {
      ...waiting,
      status: CHORE_OCCURRENCE_STATUS.COMPLETED,
      approvedAt,
      completedAt: approvedAt,
      definition: { id: 'def1' },
      createdAt,
    } as ChoreOccurrence;

    jest.spyOn(service, 'loadOccurrence').mockResolvedValue(afterApprove);

    await service.approveOccurrence('g1', adminUser, 'occ1');

    expect(choreRepository.insertOpenOccurrence).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ id: 'def1', recurrence: 'daily' }),
      new Date(2026, 4, 3, 10, 0, 0),
    );
  });

  it('rejectOccurrence — não credita moedas', async () => {
    choreRepository.findOccurrenceWaitingApproval.mockResolvedValue({
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
    } as ChoreOccurrence);

    choreRepository.saveOccurrence.mockResolvedValue({} as ChoreOccurrence);

    jest
      .spyOn(service, 'loadOccurrence')
      .mockResolvedValue({ id: 'occ1', status: 'rejected' } as ChoreOccurrence);

    await service.rejectOccurrence('g1', adminUser, 'occ1', 'Motivo');

    expect(coinService.addEarnedCoinsByAmount).not.toHaveBeenCalled();
  });

  it('settlePayroll — conflito quando período já existe', async () => {
    choreRepository.findPayrollSettlementByGroupAndPeriod.mockResolvedValue({
      id: 'set1',
    } as ChorePayrollSettlement);

    await expect(
      service.settlePayroll('g1', adminUser, 202601),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('submitOccurrence — exige par de fotos quando requirePhoto', async () => {
    jest
      .spyOn(
        service as unknown as { loadOccurrenceWritable: jest.Mock },
        'loadOccurrenceWritable',
      )
      .mockResolvedValue({
        definition: { requirePhoto: true },
        photoBeforeUrl: null,
        photoAfterUrl: 'y',
      });

    await expect(
      service.submitOccurrence('g1', memberUser, 'occ1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getPendingCoinRewards — valida membership e delega ao repositório', async () => {
    choreRepository.sumPendingCoinRewards.mockResolvedValue(12);

    const total = await service.getPendingCoinRewards('g1', memberUser);

    expect(familyGroupService.assertAcceptedMembership).toHaveBeenCalledWith(
      'g1',
      memberUser.id,
    );
    expect(choreRepository.sumPendingCoinRewards).toHaveBeenCalledWith(
      'g1',
      memberUser.id,
    );
    expect(total).toBe(12);
  });

  it('returnOccurrenceForAdjustment — devolve para IN_PROGRESS mantendo executor', async () => {
    const waiting = {
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      assignedTo: memberUser,
      submittedAt: new Date(),
      approvedBy: null,
      rejectionReason: null,
    } as ChoreOccurrence;

    choreRepository.findOccurrenceWaitingApproval.mockResolvedValue(waiting);
    choreRepository.saveOccurrence.mockImplementation(async (o) => o);

    const afterReturn = {
      ...waiting,
      status: CHORE_OCCURRENCE_STATUS.IN_PROGRESS,
      submittedAt: null,
    } as ChoreOccurrence;

    jest.spyOn(service, 'loadOccurrence').mockResolvedValue(afterReturn);

    const result = await service.returnOccurrenceForAdjustment(
      'g1',
      adminUser,
      'occ1',
    );

    expect(familyGroupService.assertFamilyAdmin).toHaveBeenCalledWith(
      'g1',
      adminUser.id,
    );
    expect(choreRepository.saveOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CHORE_OCCURRENCE_STATUS.IN_PROGRESS,
        submittedAt: null,
        assignedTo: memberUser,
      }),
    );
    expect(result.status).toBe(CHORE_OCCURRENCE_STATUS.IN_PROGRESS);
  });

  it('returnOccurrenceForAdjustment — exige executor associado', async () => {
    choreRepository.findOccurrenceWaitingApproval.mockResolvedValue({
      id: 'occ1',
      deletedAt: null,
      status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      assignedTo: null,
    } as ChoreOccurrence);

    await expect(
      service.returnOccurrenceForAdjustment('g1', adminUser, 'occ1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(choreRepository.saveOccurrence).not.toHaveBeenCalled();
  });

  it('returnOccurrenceForAdjustment — NotExistException quando não aguarda aprovação', async () => {
    choreRepository.findOccurrenceWaitingApproval.mockResolvedValue(null);

    await expect(
      service.returnOccurrenceForAdjustment('g1', adminUser, 'occ1'),
    ).rejects.toBeInstanceOf(NotExistException);

    expect(choreRepository.saveOccurrence).not.toHaveBeenCalled();
  });

  it('celebratePendingCoinRewards — valida membership e retorna total celebrado', async () => {
    choreRepository.celebratePendingCoinRewards.mockResolvedValue(7);

    const total = await service.celebratePendingCoinRewards('g1', memberUser);

    expect(familyGroupService.assertAcceptedMembership).toHaveBeenCalledWith(
      'g1',
      memberUser.id,
    );
    expect(choreRepository.celebratePendingCoinRewards).toHaveBeenCalledWith(
      'g1',
      memberUser.id,
    );
    expect(total).toBe(7);
  });

  it('celebratePendingCoinRewards — retorna zero quando não há pendentes', async () => {
    choreRepository.celebratePendingCoinRewards.mockResolvedValue(0);

    const total = await service.celebratePendingCoinRewards('g1', memberUser);

    expect(total).toBe(0);
  });
});
