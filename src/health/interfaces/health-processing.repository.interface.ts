import { EntityManager } from 'typeorm';
import { HealthExamProcessing } from '../entities/health-exam-processing.entity';
import type { ExtractedExamData } from 'src/text-recognition/types/textRecognitionType';

export interface IHealthProcessingRepository {
  create(
    data: Partial<HealthExamProcessing>,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing>;

  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing | null>;

  findForUser(
    userId: string,
    groupId: string | null,
    isAdmin: boolean,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]>;

  findQueued(
    limit: number,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]>;

  findFailedReadyForAutoRetry(
    limit: number,
    retryAfterMs: number,
    manager?: EntityManager,
  ): Promise<HealthExamProcessing[]>;

  updateStatus(
    id: string,
    status: string,
    extras?: {
      extractedData?: ExtractedExamData;
      errorMessage?: string | null;
      failedAt?: Date | null;
      retryCount?: number;
    },
    manager?: EntityManager,
  ): Promise<void>;

  deleteById(id: string, manager?: EntityManager): Promise<void>;
}
