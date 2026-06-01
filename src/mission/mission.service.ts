import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoinService } from 'src/coin/coin.service';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { MissionDefinition } from './entities/mission-definition.entity';
import { IMissionDefinitionRepository } from './interfaces/mission-definition.repository.interface';
import { IUserMissionProgressRepository } from './interfaces/user-mission-progress.repository.interface';
import { MissionFrequency } from './types/mission-frequency.enum';

const FINANCIAL_MISSION_KEYS = [
  'monthly_spend_under_80',
  'monthly_spend_under_60',
  'monthly_spend_under_50',
] as const;

const FINANCIAL_THRESHOLDS: Record<string, number> = {
  monthly_spend_under_80: 80,
  monthly_spend_under_60: 60,
  monthly_spend_under_50: 50,
};

export interface MissionWithProgress {
  mission: MissionDefinition;
  progress: {
    id: string | null;
    currentValue: number;
    isCompleted: boolean;
    isClaimed: boolean;
    resetAt: Date | null;
  };
}

@Injectable()
export class MissionService {
  constructor(
    @Inject('IMissionDefinitionRepository')
    private readonly missionDefRepo: IMissionDefinitionRepository,
    @Inject('IUserMissionProgressRepository')
    private readonly progressRepo: IUserMissionProgressRepository,
    private readonly coinService: CoinService,
    private readonly expenseService: ExpenseService,
    private readonly revenueService: RevenueService,
    private readonly userService: UserService,
  ) {}

  /**
   * Returns total monthly expense / total monthly revenue as a percentage (0–Infinity).
   * Pure method to keep it easily testable.
   */
  calculateSpendingPercentage(
    totalExpense: number,
    totalRevenue: number,
  ): number {
    if (!totalRevenue || totalRevenue <= 0) {
      return totalExpense > 0 ? 100 : 0;
    }
    return (totalExpense / totalRevenue) * 100;
  }

  async getMissionsWithProgress(user: User): Promise<MissionWithProgress[]> {
    const [definitions, existingProgresses] = await Promise.all([
      this.missionDefRepo.findAll(),
      this.progressRepo.findAllByUser(user.id),
    ]);

    const progressMap = new Map(
      existingProgresses.map((p) => [p.missionDefinitionId, p]),
    );

    return definitions.map((mission) => {
      const progress = progressMap.get(mission.id);

      return {
        mission,
        progress: {
          id: progress?.id ?? null,
          currentValue: progress?.currentValue ?? 0,
          isCompleted: progress?.isCompleted ?? false,
          isClaimed: progress?.isClaimed ?? false,
          resetAt: progress?.resetAt ?? null,
        },
      };
    });
  }

  async incrementProgress(userId: string, missionKey: string): Promise<void> {
    const mission = await this.missionDefRepo.findByKey(missionKey);
    if (!mission) return;

    const existing = await this.progressRepo.findByUserAndMission(
      userId,
      mission.id,
    );

    if (
      mission.frequency === MissionFrequency.ONCE &&
      (existing?.isCompleted || existing?.isClaimed)
    ) {
      return;
    }

    if (existing?.isCompleted && mission.frequency !== MissionFrequency.ONCE) {
      return;
    }

    const nextValue = Math.min(
      (existing?.currentValue ?? 0) + 1,
      mission.targetValue,
    );
    const isCompleted = nextValue >= mission.targetValue;

    await this.progressRepo.upsert(userId, mission.id, {
      currentValue: nextValue,
      isCompleted,
      lastUpdatedAt: new Date(),
    });
  }

  async setFinancialHealthProgress(userId: string): Promise<void> {
    const user = await this.userService.find(userId);
    if (!user) return;

    const [expenseResult, revenueResult] = await Promise.all([
      this.expenseService.getExpenseByCurrentMonth(user),
      this.revenueService.getRevenueByCurrentMonth(user),
    ]);

    const spendPercent = this.calculateSpendingPercentage(
      expenseResult.value,
      revenueResult.value,
    );

    await Promise.all(
      FINANCIAL_MISSION_KEYS.map(async (key) => {
        const mission = await this.missionDefRepo.findByKey(key);
        if (!mission) return;

        const existing = await this.progressRepo.findByUserAndMission(
          userId,
          mission.id,
        );

        if (existing?.isClaimed) return;

        const threshold = FINANCIAL_THRESHOLDS[key];
        const isUnderThreshold = spendPercent < threshold;

        await this.progressRepo.upsert(userId, mission.id, {
          currentValue: isUnderThreshold ? 1 : 0,
          isCompleted: isUnderThreshold,
          lastUpdatedAt: new Date(),
        });
      }),
    );
  }

  async claimReward(user: User, progressId: string): Promise<void> {
    const progress = await this.progressRepo.findByUserAndProgressId(
      user.id,
      progressId,
    );

    if (!progress) {
      throw new NotFoundException('Progresso de missão não encontrado.');
    }

    if (!progress.isCompleted) {
      throw new ForbiddenException('A missão ainda não foi concluída.');
    }

    if (progress.isClaimed) {
      throw new ForbiddenException('A recompensa já foi resgatada.');
    }

    const claimed = await this.progressRepo.claimIfEligible(
      user.id,
      progressId,
    );

    if (!claimed) {
      throw new ForbiddenException('A recompensa já foi resgatada.');
    }

    const description = `Missão concluída: ${claimed.missionDefinition.title}`;

    try {
      await this.coinService.addEarnedCoinsByAmount(
        user,
        claimed.missionDefinition.rewardCoins,
        description,
      );
    } catch (error) {
      await this.progressRepo.revertClaim(user.id, progressId);
      throw error;
    }
  }

  async resetDailyMissions(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await this.progressRepo.resetByFrequency(MissionFrequency.DAILY, tomorrow);
  }

  async resetMonthlyMissions(): Promise<void> {
    const firstNextMonth = new Date();
    firstNextMonth.setMonth(firstNextMonth.getMonth() + 1, 1);
    firstNextMonth.setHours(0, 0, 0, 0);

    await this.progressRepo.resetByFrequency(
      MissionFrequency.MONTHLY,
      firstNextMonth,
    );
  }
}
