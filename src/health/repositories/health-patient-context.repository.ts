import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HealthPatientContext } from '../entities/health-patient-context.entity';
import { IHealthPatientContextRepository } from '../interfaces/health-patient-context.repository.interface';

@Injectable()
export class HealthPatientContextRepository implements IHealthPatientContextRepository {
  constructor(
    @InjectRepository(HealthPatientContext)
    private readonly entity: Repository<HealthPatientContext>,
  ) {}

  private repo(manager?: EntityManager): Repository<HealthPatientContext> {
    return manager ? manager.getRepository(HealthPatientContext) : this.entity;
  }

  async create(
    data: Partial<HealthPatientContext>,
    manager?: EntityManager,
  ): Promise<HealthPatientContext> {
    const repo = this.repo(manager);
    const row = repo.create(data);
    return repo.save(row);
  }

  async findByUserId(
    userId: string,
    groupId: string | null,
    manager?: EntityManager,
  ): Promise<HealthPatientContext[]> {
    const qb = this.repo(manager)
      .createQueryBuilder('ctx')
      .leftJoinAndSelect('ctx.createdBy', 'createdBy')
      .where('ctx.userId = :userId', { userId });

    if (groupId) {
      qb.andWhere('ctx.familyGroupId = :groupId', { groupId });
    }

    return qb.orderBy('ctx.createdAt', 'DESC').getMany();
  }

  async countCreatedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<number> {
    return this.repo(manager)
      .createQueryBuilder('ctx')
      .where('ctx.userId = :userId', { userId })
      .andWhere('ctx.createdAt > :since', { since })
      .getCount();
  }
}
