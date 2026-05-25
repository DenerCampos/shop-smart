import { MissionFrequency } from '../types/mission-frequency.enum';
import { UserMissionProgress } from '../entities/user-mission-progress.entity';

export interface IUserMissionProgressRepository {
  findByUserAndMission(
    userId: string,
    missionDefinitionId: string,
  ): Promise<UserMissionProgress | null>;

  findByUserAndProgressId(
    userId: string,
    progressId: string,
  ): Promise<UserMissionProgress | null>;

  findAllByUser(userId: string): Promise<UserMissionProgress[]>;

  upsert(
    userId: string,
    missionDefinitionId: string,
    data: Partial<UserMissionProgress>,
  ): Promise<UserMissionProgress>;

  claimIfEligible(
    userId: string,
    progressId: string,
  ): Promise<UserMissionProgress | null>;

  revertClaim(userId: string, progressId: string): Promise<void>;

  resetByFrequency(frequency: MissionFrequency, resetAt: Date): Promise<void>;
}
