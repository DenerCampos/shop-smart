import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HealthExam } from '../entities/health-exam.entity';
import { HealthExamItem } from '../entities/health-exam-item.entity';
import { HealthExamFile } from '../entities/health-exam-file.entity';
import {
  HealthExamListResult,
  IHealthExamRepository,
} from '../interfaces/health-exam.repository.interface';
import type { HealthExamFilterDto } from '../dto/health-exam-filter.dto';

@Injectable()
export class HealthExamRepository implements IHealthExamRepository {
  constructor(
    @InjectRepository(HealthExam)
    private readonly examEntity: Repository<HealthExam>,
    @InjectRepository(HealthExamItem)
    private readonly itemEntity: Repository<HealthExamItem>,
    @InjectRepository(HealthExamFile)
    private readonly fileEntity: Repository<HealthExamFile>,
  ) {}

  private exam(manager?: EntityManager): Repository<HealthExam> {
    return manager ? manager.getRepository(HealthExam) : this.examEntity;
  }

  private item(manager?: EntityManager): Repository<HealthExamItem> {
    return manager ? manager.getRepository(HealthExamItem) : this.itemEntity;
  }

  private file(manager?: EntityManager): Repository<HealthExamFile> {
    return manager ? manager.getRepository(HealthExamFile) : this.fileEntity;
  }

  async createExam(
    examData: Partial<HealthExam>,
    items: Partial<HealthExamItem>[],
    manager?: EntityManager,
  ): Promise<HealthExam> {
    const repo = this.exam(manager);
    const itemRepo = this.item(manager);

    const exam = repo.create(examData);
    const saved = await repo.save(exam);

    if (items.length) {
      const examItems = items.map((i) =>
        itemRepo.create({ ...i, exam: { id: saved.id } as any }),
      );
      await itemRepo.save(examItems);
    }

    return this.findById(saved.id, manager) as Promise<HealthExam>;
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthExam | null> {
    return this.exam(manager).findOne({
      where: { id, deletedAt: null as any },
      relations: ['items', 'files', 'user', 'createdBy'],
    });
  }

  async findAll(
    filter: HealthExamFilterDto,
    groupId: string | null,
    isAdmin: boolean,
    requestingUserId: string,
    manager?: EntityManager,
  ): Promise<HealthExamListResult> {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const offset = (page - 1) * limit;

    const qb = this.exam(manager)
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.items', 'items')
      .leftJoinAndSelect('exam.files', 'files')
      .leftJoinAndSelect('exam.user', 'user')
      .where('exam.deletedAt IS NULL')
      .andWhere('exam.status = :status', { status: 'APPROVED' });

    if (filter.userId) {
      if (groupId) {
        qb.andWhere('exam.familyGroupId = :groupId', { groupId });
      }
      qb.andWhere('exam.userId = :userId', { userId: filter.userId });
    } else if (groupId) {
      qb.andWhere('exam.familyGroupId = :groupId', { groupId });
    } else {
      qb.andWhere('exam.userId = :userId', { userId: requestingUserId });
    }

    if (filter.examType) {
      qb.andWhere('exam.examType = :examType', { examType: filter.examType });
    }
    if (filter.doctorName) {
      qb.andWhere('exam.doctorName LIKE :doctorName', {
        doctorName: `%${filter.doctorName}%`,
      });
    }
    if (filter.labName) {
      qb.andWhere('exam.labName LIKE :labName', {
        labName: `%${filter.labName}%`,
      });
    }
    if (filter.dateFrom) {
      qb.andWhere('exam.examDate >= :dateFrom', { dateFrom: filter.dateFrom });
    }
    if (filter.dateTo) {
      qb.andWhere('exam.examDate <= :dateTo', { dateTo: filter.dateTo });
    }
    if (filter.examName) {
      // Subquery para evitar duplicatas quando um exame tem vários itens com nome correspondente
      qb.andWhere(
        'exam.id IN (SELECT i.examId FROM health_exam_item i WHERE i.itemName LIKE :examName)',
        { examName: `%${filter.examName}%` },
      );
    }

    qb.orderBy('exam.examDate', 'DESC').skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findApprovedByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<HealthExam[]> {
    return this.exam(manager).find({
      where: {
        user: { id: userId },
        status: 'APPROVED',
        deletedAt: null as any,
      },
      relations: ['items'],
      order: { examDate: 'DESC' },
    });
  }

  async findApprovedByUserIdChangedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<HealthExam[]> {
    return this.exam(manager)
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.items', 'items')
      .where('exam.userId = :userId', { userId })
      .andWhere('exam.status = :status', { status: 'APPROVED' })
      .andWhere('exam.deletedAt IS NULL')
      .andWhere('(exam.createdAt > :since OR exam.updatedAt > :since)', {
        since,
      })
      .orderBy('exam.examDate', 'DESC')
      .getMany();
  }

  async countApprovedUpdatedAfter(
    userId: string,
    since: Date,
    manager?: EntityManager,
  ): Promise<number> {
    return this.exam(manager)
      .createQueryBuilder('exam')
      .where('exam.userId = :userId', { userId })
      .andWhere('exam.status = :status', { status: 'APPROVED' })
      .andWhere('exam.deletedAt IS NULL')
      .andWhere('(exam.updatedAt > :since OR exam.createdAt > :since)', {
        since,
      })
      .getCount();
  }

  async saveExam(
    exam: HealthExam,
    manager?: EntityManager,
  ): Promise<HealthExam> {
    return this.exam(manager).save(exam);
  }

  async replaceItems(
    examId: string,
    items: Partial<HealthExamItem>[],
    manager?: EntityManager,
  ): Promise<void> {
    const itemRepo = this.item(manager);
    await itemRepo.delete({ exam: { id: examId } as any });
    if (items.length) {
      const newItems = items.map((i) =>
        itemRepo.create({ ...i, exam: { id: examId } as any }),
      );
      await itemRepo.save(newItems);
    }
  }

  async attachFiles(
    examId: string,
    files: Array<{
      fileUrl: string;
      fileType: 'PDF' | 'IMAGE';
      originalFilename?: string | null;
      pageCount?: number | null;
    }>,
    manager?: EntityManager,
  ): Promise<void> {
    if (!files.length) return;

    const fileRepo = this.file(manager);
    const rows = files.map((f) =>
      fileRepo.create({
        ...f,
        exam: { id: examId } as HealthExam,
      }),
    );
    await fileRepo.save(rows);
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    await this.exam(manager).softDelete(id);
  }
}
