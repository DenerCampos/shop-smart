import { EntityManager } from 'typeorm';
import { HealthPatientContext } from '../entities/health-patient-context.entity';

export interface IHealthPatientContextRepository {
  create(
    data: Partial<HealthPatientContext>,
    manager?: EntityManager,
  ): Promise<HealthPatientContext>;

  findByUserId(
    userId: string,
    groupId: string | null,
    manager?: EntityManager,
  ): Promise<HealthPatientContext[]>;

  findByUserIdCreatedAfter(
    userId: string,
    groupId: string | null,
    since: Date,
    manager?: EntityManager,
  ): Promise<HealthPatientContext[]>;

  countCreatedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<number>;
}
