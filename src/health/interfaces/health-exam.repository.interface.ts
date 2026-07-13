import { EntityManager } from 'typeorm';
import { HealthExam } from '../entities/health-exam.entity';
import { HealthExamItem } from '../entities/health-exam-item.entity';
import type { HealthExamFilterDto } from '../dto/health-exam-filter.dto';

export interface HealthExamListResult {
  data: HealthExam[];
  total: number;
  page: number;
  limit: number;
}

export interface IHealthExamRepository {
  createExam(
    examData: Partial<HealthExam>,
    items: Partial<HealthExamItem>[],
    manager?: EntityManager,
  ): Promise<HealthExam>;

  findById(id: string, manager?: EntityManager): Promise<HealthExam | null>;

  findAll(
    filter: HealthExamFilterDto,
    groupId: string | null,
    isAdmin: boolean,
    requestingUserId: string,
    manager?: EntityManager,
  ): Promise<HealthExamListResult>;

  findApprovedByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<HealthExam[]>;

  findApprovedByUserIdChangedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<HealthExam[]>;

  countApprovedUpdatedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<number>;

  saveExam(exam: HealthExam, manager?: EntityManager): Promise<HealthExam>;

  replaceItems(
    examId: string,
    items: Partial<HealthExamItem>[],
    manager?: EntityManager,
  ): Promise<void>;

  attachFiles(
    examId: string,
    files: Array<{
      fileUrl: string;
      fileType: 'PDF' | 'IMAGE';
      originalFilename?: string | null;
      pageCount?: number | null;
    }>,
    manager?: EntityManager,
  ): Promise<void>;

  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
