import { EntityManager } from 'typeorm';
import { HealthAiOverview } from '../entities/health-ai-overview.entity';

export interface IHealthOverviewRepository {
  save(
    data: Partial<HealthAiOverview>,
    manager?: EntityManager,
  ): Promise<HealthAiOverview>;

  findLatest(
    userId: string,
    groupId: string | null,
    manager?: EntityManager,
  ): Promise<HealthAiOverview | null>;
}
