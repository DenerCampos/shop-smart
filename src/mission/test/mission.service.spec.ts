import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MissionService } from '../mission.service';
import { MissionFrequency } from '../types/mission-frequency.enum';
import { MissionDefinition } from '../entities/mission-definition.entity';
import { UserMissionProgress } from '../entities/user-mission-progress.entity';
import { User } from 'src/user/entities/user.entity';

const makeMission = (
  overrides: Partial<MissionDefinition> = {},
): MissionDefinition =>
  ({
    id: 'def-1',
    key: 'daily_login',
    title: 'Acesso Diário',
    description: 'Entre no app.',
    frequency: MissionFrequency.DAILY,
    rewardCoins: 5,
    targetValue: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    progresses: [],
    ...overrides,
  }) as MissionDefinition;

const makeProgress = (
  overrides: Partial<UserMissionProgress> = {},
): UserMissionProgress =>
  ({
    id: 'progress-1',
    userId: 'user-1',
    missionDefinitionId: 'def-1',
    currentValue: 0,
    isCompleted: false,
    isClaimed: false,
    lastUpdatedAt: null,
    resetAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    missionDefinition: makeMission(),
    user: { id: 'user-1' } as User,
    ...overrides,
  }) as UserMissionProgress;

const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: 'user-1', ...overrides }) as User;

describe('MissionService', () => {
  let service: MissionService;

  const missionDefRepo = {
    findAll: jest.fn(),
    findByKey: jest.fn(),
    findById: jest.fn(),
  };

  const progressRepo = {
    findByUserAndMission: jest.fn(),
    findByUserAndProgressId: jest.fn(),
    findAllByUser: jest.fn(),
    upsert: jest.fn(),
    claimIfEligible: jest.fn(),
    revertClaim: jest.fn(),
    resetByFrequency: jest.fn(),
  };

  const coinService = {
    addEarnedCoinsByAmount: jest.fn(),
  };

  const expenseService = {
    getExpenseByCurrentMonth: jest.fn(),
  };

  const revenueService = {
    getRevenueByCurrentMonth: jest.fn(),
  };

  const userService = {
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new MissionService(
      missionDefRepo as any,
      progressRepo as any,
      coinService as any,
      expenseService as any,
      revenueService as any,
      userService as any,
    );
  });

  describe('calculateSpendingPercentage', () => {
    it('returns 0 when both expense and revenue are zero', () => {
      expect(service.calculateSpendingPercentage(0, 0)).toBe(0);
    });

    it('returns 100 when expense > 0 and revenue is zero', () => {
      expect(service.calculateSpendingPercentage(500, 0)).toBe(100);
    });

    it('returns correct percentage when under 50%', () => {
      expect(service.calculateSpendingPercentage(400, 1000)).toBe(40);
    });

    it('returns correct percentage when exactly 50%', () => {
      expect(service.calculateSpendingPercentage(500, 1000)).toBe(50);
    });

    it('returns correct percentage when between 60% and 80%', () => {
      expect(service.calculateSpendingPercentage(700, 1000)).toBe(70);
    });

    it('returns correct percentage when exactly 80%', () => {
      expect(service.calculateSpendingPercentage(800, 1000)).toBe(80);
    });

    it('returns over 100 when expenses exceed revenue', () => {
      expect(service.calculateSpendingPercentage(1200, 1000)).toBe(120);
    });

    it('handles decimal values correctly', () => {
      const result = service.calculateSpendingPercentage(333.33, 1000);
      expect(result).toBeCloseTo(33.333, 2);
    });
  });

  describe('claimReward', () => {
    it('awards coins and marks isClaimed when mission is completed and not yet claimed', async () => {
      const user = makeUser();
      const progress = makeProgress({
        isCompleted: true,
        isClaimed: false,
        missionDefinition: makeMission({ rewardCoins: 5 }),
      });
      progressRepo.findByUserAndProgressId.mockResolvedValue(progress);
      progressRepo.claimIfEligible.mockResolvedValue(progress);
      coinService.addEarnedCoinsByAmount.mockResolvedValue({});

      await service.claimReward(user, 'progress-1');

      expect(progressRepo.claimIfEligible).toHaveBeenCalledWith(
        'user-1',
        'progress-1',
      );
      expect(coinService.addEarnedCoinsByAmount).toHaveBeenCalledWith(
        user,
        5,
        expect.any(String),
      );
    });

    it('reverts claim when coin credit fails', async () => {
      const user = makeUser();
      const progress = makeProgress({
        isCompleted: true,
        isClaimed: false,
      });
      progressRepo.findByUserAndProgressId.mockResolvedValue(progress);
      progressRepo.claimIfEligible.mockResolvedValue(progress);
      coinService.addEarnedCoinsByAmount.mockRejectedValue(
        new Error('coin failure'),
      );

      await expect(service.claimReward(user, 'progress-1')).rejects.toThrow(
        'coin failure',
      );

      expect(progressRepo.revertClaim).toHaveBeenCalledWith(
        'user-1',
        'progress-1',
      );
    });

    it('throws NotFoundException when progress id does not belong to user', async () => {
      progressRepo.findByUserAndProgressId.mockResolvedValue(null);

      await expect(
        service.claimReward(makeUser(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when mission is not completed', async () => {
      const user = makeUser();
      const progress = makeProgress({ isCompleted: false, isClaimed: false });
      progressRepo.findByUserAndProgressId.mockResolvedValue(progress);

      await expect(service.claimReward(user, 'progress-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when reward was already claimed', async () => {
      const user = makeUser();
      const progress = makeProgress({ isCompleted: true, isClaimed: true });
      progressRepo.findByUserAndProgressId.mockResolvedValue(progress);

      await expect(service.claimReward(user, 'progress-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('incrementProgress', () => {
    it('creates progress if none exists and marks completed when target reached', async () => {
      const mission = makeMission({ targetValue: 1 });
      missionDefRepo.findByKey.mockResolvedValue(mission);
      progressRepo.findByUserAndMission.mockResolvedValue(null);
      progressRepo.upsert.mockResolvedValue({});

      await service.incrementProgress('user-1', 'daily_login');

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        'def-1',
        expect.objectContaining({ currentValue: 1, isCompleted: true }),
      );
    });

    it('does not increment a ONCE mission that is already completed', async () => {
      const mission = makeMission({
        frequency: MissionFrequency.ONCE,
        key: 'once_first_recipe',
      });
      missionDefRepo.findByKey.mockResolvedValue(mission);
      progressRepo.findByUserAndMission.mockResolvedValue(
        makeProgress({ isCompleted: true, isClaimed: false }),
      );

      await service.incrementProgress('user-1', 'once_first_recipe');

      expect(progressRepo.upsert).not.toHaveBeenCalled();
    });

    it('does not increment a ONCE mission that is already claimed', async () => {
      const mission = makeMission({
        frequency: MissionFrequency.ONCE,
        key: 'once_first_recipe',
      });
      missionDefRepo.findByKey.mockResolvedValue(mission);
      progressRepo.findByUserAndMission.mockResolvedValue(
        makeProgress({ isClaimed: true }),
      );

      await service.incrementProgress('user-1', 'once_first_recipe');

      expect(progressRepo.upsert).not.toHaveBeenCalled();
    });

    it('does not increment a DAILY mission that is already completed', async () => {
      const mission = makeMission({ targetValue: 1 });
      missionDefRepo.findByKey.mockResolvedValue(mission);
      progressRepo.findByUserAndMission.mockResolvedValue(
        makeProgress({ currentValue: 1, isCompleted: true }),
      );

      await service.incrementProgress('user-1', 'daily_login');

      expect(progressRepo.upsert).not.toHaveBeenCalled();
    });

    it('caps currentValue at targetValue', async () => {
      const mission = makeMission({ targetValue: 2 });
      missionDefRepo.findByKey.mockResolvedValue(mission);
      progressRepo.findByUserAndMission.mockResolvedValue(
        makeProgress({ currentValue: 1, isCompleted: false }),
      );
      progressRepo.upsert.mockResolvedValue({});

      await service.incrementProgress('user-1', 'daily_login');

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        'def-1',
        expect.objectContaining({ currentValue: 2, isCompleted: true }),
      );
    });

    it('silently returns when mission key does not exist', async () => {
      missionDefRepo.findByKey.mockResolvedValue(null);

      await expect(
        service.incrementProgress('user-1', 'unknown_key'),
      ).resolves.toBeUndefined();
      expect(progressRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('setFinancialHealthProgress', () => {
    it('sets isCompleted=true for under-80% mission when spending is below threshold', async () => {
      userService.find.mockResolvedValue(makeUser());
      expenseService.getExpenseByCurrentMonth.mockResolvedValue({ value: 700 });
      revenueService.getRevenueByCurrentMonth.mockResolvedValue({
        value: 1000,
      });

      const mission80 = makeMission({
        key: 'monthly_spend_under_80',
        id: 'def-80',
      });
      missionDefRepo.findByKey.mockImplementation((key: string) => {
        const map: Record<string, MissionDefinition | null> = {
          monthly_spend_under_80: mission80,
          monthly_spend_under_60: null,
          monthly_spend_under_50: null,
        };
        return Promise.resolve(map[key] ?? null);
      });
      progressRepo.findByUserAndMission.mockResolvedValue(null);
      progressRepo.upsert.mockResolvedValue({});

      await service.setFinancialHealthProgress('user-1');

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        'def-80',
        expect.objectContaining({ currentValue: 1, isCompleted: true }),
      );
    });

    it('sets isCompleted=false when spending exceeds threshold', async () => {
      userService.find.mockResolvedValue(makeUser());
      expenseService.getExpenseByCurrentMonth.mockResolvedValue({ value: 900 });
      revenueService.getRevenueByCurrentMonth.mockResolvedValue({
        value: 1000,
      });

      const mission80 = makeMission({
        key: 'monthly_spend_under_80',
        id: 'def-80',
      });
      missionDefRepo.findByKey.mockResolvedValue(mission80);
      progressRepo.findByUserAndMission.mockResolvedValue(null);
      progressRepo.upsert.mockResolvedValue({});

      await service.setFinancialHealthProgress('user-1');

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        'def-80',
        expect.objectContaining({ currentValue: 0, isCompleted: false }),
      );
    });

    it('does not downgrade an already-claimed mission', async () => {
      userService.find.mockResolvedValue(makeUser());
      expenseService.getExpenseByCurrentMonth.mockResolvedValue({ value: 900 });
      revenueService.getRevenueByCurrentMonth.mockResolvedValue({
        value: 1000,
      });

      const mission80 = makeMission({
        key: 'monthly_spend_under_80',
        id: 'def-80',
      });
      missionDefRepo.findByKey.mockResolvedValue(mission80);
      progressRepo.findByUserAndMission.mockResolvedValue(
        makeProgress({ isClaimed: true }),
      );

      await service.setFinancialHealthProgress('user-1');

      expect(progressRepo.upsert).not.toHaveBeenCalled();
    });
  });
});
