import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMissionProgress } from '../entities/user-mission-progress.entity';
import { IUserMissionProgressRepository } from '../interfaces/user-mission-progress.repository.interface';
import { MissionFrequency } from '../types/mission-frequency.enum';

@Injectable()
export class UserMissionProgressRepository implements IUserMissionProgressRepository {
  constructor(
    @InjectRepository(UserMissionProgress)
    private readonly repo: Repository<UserMissionProgress>,
  ) {}

  findByUserAndMission(
    userId: string,
    missionDefinitionId: string,
  ): Promise<UserMissionProgress | null> {
    return this.repo.findOne({ where: { userId, missionDefinitionId } });
  }

  findByUserAndProgressId(
    userId: string,
    progressId: string,
  ): Promise<UserMissionProgress | null> {
    return this.repo.findOne({
      where: { id: progressId, userId },
      relations: ['missionDefinition'],
    });
  }

  findAllByUser(userId: string): Promise<UserMissionProgress[]> {
    return this.repo.find({
      where: { userId },
      relations: ['missionDefinition'],
    });
  }

  async upsert(
    userId: string,
    missionDefinitionId: string,
    data: Partial<UserMissionProgress>,
  ): Promise<UserMissionProgress> {
    let progress = await this.findByUserAndMission(userId, missionDefinitionId);

    if (!progress) {
      progress = this.repo.create({
        userId,
        missionDefinitionId,
        currentValue: 0,
        isCompleted: false,
        isClaimed: false,
      });
    }

    Object.assign(progress, data);
    return this.repo.save(progress);
  }

  async claimIfEligible(
    userId: string,
    progressId: string,
  ): Promise<UserMissionProgress | null> {
    const result = await this.repo
      .createQueryBuilder()
      .update(UserMissionProgress)
      .set({ isClaimed: true, lastUpdatedAt: new Date() })
      .where('id = :progressId', { progressId })
      .andWhere('userId = :userId', { userId })
      .andWhere('isCompleted = :isCompleted', { isCompleted: true })
      .andWhere('isClaimed = :isClaimed', { isClaimed: false })
      .execute();

    if (!result.affected) {
      return null;
    }

    return this.findByUserAndProgressId(userId, progressId);
  }

  async revertClaim(userId: string, progressId: string): Promise<void> {
    await this.repo.update(
      { id: progressId, userId, isClaimed: true },
      { isClaimed: false, lastUpdatedAt: new Date() },
    );
  }

  async resetByFrequency(
    frequency: MissionFrequency,
    resetAt: Date,
  ): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(UserMissionProgress)
      .set({
        currentValue: 0,
        isCompleted: false,
        isClaimed: false,
        resetAt,
        lastUpdatedAt: new Date(),
      })
      .where(
        `missionDefinitionId IN (SELECT id FROM mission_definition WHERE frequency = :frequency AND isActive = 1)`,
        { frequency },
      )
      .andWhere('NOT (isCompleted = :completed AND isClaimed = :claimed)', {
        completed: true,
        claimed: false,
      })
      .execute();
  }
}
