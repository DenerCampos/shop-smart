import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HealthAiOverview } from '../entities/health-ai-overview.entity';
import { IHealthOverviewRepository } from '../interfaces/health-overview.repository.interface';

@Injectable()
export class HealthOverviewRepository implements IHealthOverviewRepository {
  constructor(
    @InjectRepository(HealthAiOverview)
    private readonly entity: Repository<HealthAiOverview>,
  ) {}

  private repo(manager?: EntityManager): Repository<HealthAiOverview> {
    return manager ? manager.getRepository(HealthAiOverview) : this.entity;
  }

  async save(
    data: Partial<HealthAiOverview>,
    manager?: EntityManager,
  ): Promise<HealthAiOverview> {
    const repo = this.repo(manager);
    const overview = repo.create(data);
    return repo.save(overview);
  }

  async findLatest(
    userId: string,
    groupId: string | null,
    manager?: EntityManager,
  ): Promise<HealthAiOverview | null> {
    return this.repo(manager).findOne({
      where: {
        user: { id: userId },
        familyGroup: groupId ? ({ id: groupId } as any) : (undefined as any),
      },
      order: { generatedAt: 'DESC' },
    });
  }

  async findByFilters(
    userIds: string[],
    groupId: string | null,
    startDate?: string,
    endDate?: string,
    manager?: EntityManager,
  ): Promise<HealthAiOverview[]> {
    if (userIds.length === 0) {
      return [];
    }

    const qb = this.repo(manager)
      .createQueryBuilder('overview')
      .leftJoinAndSelect('overview.user', 'user')
      .where('overview.userId IN (:...userIds)', { userIds });

    if (groupId) {
      qb.andWhere('overview.familyGroupId = :groupId', { groupId });
    }

    if (startDate) {
      qb.andWhere('overview.generatedAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('overview.generatedAt <= :endDate', { endDate });
    }

    return qb.orderBy('overview.generatedAt', 'DESC').getMany();
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthAiOverview | null> {
    return this.repo(manager).findOne({
      where: { id },
      relations: ['user'],
    });
  }
}
