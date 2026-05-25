import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { UserService } from 'src/user/user.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { CoinService } from 'src/coin/coin.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination } from 'src/common/pagination/pagination';
import { ChoreService } from '../chore.service';
import { ChoreDefinition } from '../entities/chore-definition.entity';
import { ChoreOccurrence } from '../entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from '../entities/chore-payroll-settlement.entity';
import { CHORE_OCCURRENCE_STATUS } from '../types/chore-occurrence-status.type';
import { User } from 'src/user/entities/user.entity';
import { IChoreRepository } from '../interface/chore.repository.interface';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';

describe('ChoreService', () => {
  let service: ChoreService;
  let familyGroupService: {
    assertFamilyAdmin: jest.Mock;
    assertAcceptedMembership: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let choreRepository: jest.Mocked<Pick<
    IChoreRepository,
    | 'findOccurrenceForStartLocked'
    | 'saveOccurrence'
    | 'findOccurrenceForApproveLocked'
    | 'findDefinitionById'
    | 'findOccurrenceWaitingApproval'
    | 'findPayrollSettlementByGroupAndPeriod'
    | 'findOneOccurrenceVisible'
    | 'insertOpenOccurrence'
  >>;
  let coinService: { addEarnedCoinsByAmount: jest.Mock };
  let userService: { find: jest.Mock };

  const memberUser = { id: 'u-member', name: 'Filho' } as User;
  const adminUser = { id: 'u-admin', name: 'Pai' } as User;

  beforeEach(async () => {
    familyGroupService = {
      assertFamilyAdmin: jest.fn().mockResolvedValue(undefined),
      assertAcceptedMembership: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(async (fn: (m: unknown) => Promise<unknown>) => fn({})),
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
    };

    coinService = {
      addEarnedCoinsByAmount: jest.fn().mockResolvedValue({}),
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
        { provide: GoogleDriveService, useValue: { uploadFile: jest.fn() } },
        { provide: CoinService, useValue: coinService },
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

  it('approveOccurrence — registra moedas para o executor', async () => {
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
      .spyOn(service as unknown as { spawnOpenOccurrence: jest.Mock }, 'spawnOpenOccurrence')
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
      .spyOn(service as unknown as { loadOccurrenceWritable: jest.Mock }, 'loadOccurrenceWritable')
      .mockResolvedValue({
        definition: { requirePhoto: true },
        photoBeforeUrl: null,
        photoAfterUrl: 'y',
      });

    await expect(
      service.submitOccurrence('g1', memberUser, 'occ1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
