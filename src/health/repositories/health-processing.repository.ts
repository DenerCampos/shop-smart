import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HealthExamProcessing } from '../entities/health-exam-processing.entity';
import { IHealthProcessingRepository } from '../interfaces/health-processing.repository.interface';
import type { ExtractedExamData } from 'src/text-recognition/types/textRecognitionType';

@Injectable()
export class HealthProcessingRepository implements IHealthProcessingRepository {
  constructor(
    @InjectRepository(HealthExamProcessing)
    private readonly entity: Repository<HealthExamProcessing>,
  ) {}

  private repo(manager?: EntityManager): Repository<HealthExamProcessing> {
    return manager ? manager.getRepository(HealthExamProcessing) : this.entity;
  }

  async create(
    data: Partial<HealthExamProcessing>,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing> {
    const repo = this.repo(manager);
    const processing = repo.create(data);
    return repo.save(processing);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing | null> {
    return this.repo(manager).findOne({
      where: { id },
      relations: ['targetUser', 'uploadedBy', 'familyGroup'],
    });
  }

  async findForUser(
    userId: string,
    groupId: string | null,
    isAdmin: boolean,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]> {
    const qb = this.repo(manager)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.targetUser', 'targetUser')
      .leftJoinAndSelect('p.uploadedBy', 'uploadedBy');

    if (isAdmin && groupId) {
      qb.andWhere('p.familyGroupId = :groupId', { groupId });
    } else {
      qb.andWhere(
        '(p.uploadedByUserId = :userId OR p.targetUserId = :userId)',
        { userId },
      );
    }

    return qb.orderBy('p.createdAt', 'DESC').getMany();
  }

  async findQueued(
    limit: number,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]> {
    return this.repo(manager).find({
      where: { status: 'QUEUED' },
      relations: ['uploadedBy', 'targetUser'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async findFailedReadyForAutoRetry(
    limit: number,
    retryAfterMs: number,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]> {
    const cutoff = new Date(Date.now() - retryAfterMs);

    return this.repo(manager)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('p.targetUser', 'targetUser')
      .where('p.status = :status', { status: 'FAILED' })
      .andWhere(
        '(p.failedAt IS NOT NULL AND p.failedAt <= :cutoff) OR (p.failedAt IS NULL AND p.updatedAt <= :cutoff)',
        { cutoff },
      )
      .orderBy('COALESCE(p.failedAt, p.updatedAt)', 'ASC')
      .take(limit)
      .getMany();
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: {
      extractedData?: ExtractedExamData;
      errorMessage?: string | null;
      failedAt?: Date | null;
      retryCount?: number;
    },
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(id, { status, ...extras } as any);
  }

  async deleteById(id: string, manager?: EntityManager): Promise<void> {
    await this.repo(manager).delete(id);
  }
}
