import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ChoreDefinition } from '../entities/chore-definition.entity';
import { ChoreOccurrence } from '../entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from '../entities/chore-payroll-settlement.entity';
import { ChorePayrollLine } from '../entities/chore-payroll-line.entity';
import { CreateChoreDefinitionDto } from '../dto/create-chore-definition.dto';
import { CHORE_OCCURRENCE_STATUS } from '../types/chore-occurrence-status.type';
import {
  ChoreOccurrenceListMode,
  ChorePayrollPendingRawRow,
  IChoreRepository,
} from '../interface/chore.repository.interface';

@Injectable()
export class ChoreRepository implements IChoreRepository {
  constructor(
    @InjectRepository(ChoreDefinition)
    private readonly definitionEntity: Repository<ChoreDefinition>,
    @InjectRepository(ChoreOccurrence)
    private readonly occurrenceEntity: Repository<ChoreOccurrence>,
    @InjectRepository(ChorePayrollSettlement)
    private readonly payrollEntity: Repository<ChorePayrollSettlement>,
    @InjectRepository(ChorePayrollLine)
    private readonly payrollLineEntity: Repository<ChorePayrollLine>,
  ) {}

  private def(manager?: EntityManager): Repository<ChoreDefinition> {
    return manager
      ? manager.getRepository(ChoreDefinition)
      : this.definitionEntity;
  }

  private occ(manager?: EntityManager): Repository<ChoreOccurrence> {
    return manager
      ? manager.getRepository(ChoreOccurrence)
      : this.occurrenceEntity;
  }

  private payroll(manager?: EntityManager): Repository<ChorePayrollSettlement> {
    return manager
      ? manager.getRepository(ChorePayrollSettlement)
      : this.payrollEntity;
  }

  private line(manager: EntityManager): Repository<ChorePayrollLine> {
    return manager.getRepository(ChorePayrollLine);
  }

  async createDefinitionEntity(
    familyGroupId: string,
    user: User,
    dto: CreateChoreDefinitionDto,
    manager: EntityManager,
  ): Promise<ChoreDefinition> {
    const repo = this.def(manager);
    return repo.save(
      repo.create({
        familyGroup: { id: familyGroupId } as never,
        title: dto.title,
        description: dto.description ?? null,
        rewardValue: dto.rewardValue,
        coinReward: dto.coinReward ?? 0,
        requirePhoto: dto.requirePhoto ?? false,
        recurrence: dto.recurrence,
        isActive: true,
        createdBy: user,
      }),
    );
  }

  async createInitialOpenOccurrence(
    familyGroupId: string,
    definition: ChoreDefinition,
    manager: EntityManager,
  ): Promise<void> {
    const repo = this.occ(manager);
    await repo.save(
      repo.create({
        definition,
        familyGroup: { id: familyGroupId } as never,
        status: CHORE_OCCURRENCE_STATUS.OPEN,
        assignedTo: null,
        snapshotRewardMoney: null,
        snapshotCoinReward: null,
        photoBeforeUrl: null,
        photoAfterUrl: null,
        rejectionReason: null,
        approvedBy: null,
        submittedAt: null,
        approvedAt: null,
        completedAt: null,
        earnedPeriodYm: null,
        payrollSettlement: null,
        scheduledDate: null,
      }),
    );
  }

  async findDefinitionsPage(
    familyGroupId: string,
    offset: number,
    limit: number,
  ): Promise<[ChoreDefinition[], number]> {
    const qb = this.definitionEntity
      .createQueryBuilder('d')
      .where('d.familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('d.deletedAt IS NULL')
      .orderBy('d.createdAt', 'DESC');

    return qb.skip(offset).take(limit).getManyAndCount();
  }

  async findDefinitionByIdAndGroupWithRelations(
    definitionId: string,
    familyGroupId: string,
  ): Promise<ChoreDefinition | null> {
    return this.definitionEntity.findOne({
      where: {
        id: definitionId,
        familyGroup: { id: familyGroupId },
      },
      relations: ['familyGroup'],
    });
  }

  async findDefinitionById(id: string): Promise<ChoreDefinition | null> {
    return this.definitionEntity.findOne({ where: { id } });
  }

  async saveDefinition(
    entity: ChoreDefinition,
    manager?: EntityManager,
  ): Promise<ChoreDefinition> {
    return this.def(manager).save(entity);
  }

  async softRemoveDefinition(
    entity: ChoreDefinition,
    manager?: EntityManager,
  ): Promise<void> {
    await this.def(manager).softRemove(entity);
  }

  private occurrencesVisibleQueryBuilder(
    familyGroupId: string,
    manager?: EntityManager,
  ) {
    const oRepo = this.occ(manager);
    return oRepo
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.definition', 'd')
      .leftJoin('o.assignedTo', 'assignee')
      .addSelect(['assignee.id', 'assignee.name', 'assignee.profileImage'])
      .where('o.familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('o.deletedAt IS NULL')
      .andWhere('d.deletedAt IS NULL');
  }

  async findOccurrencesPage(
    familyGroupId: string,
    mode: ChoreOccurrenceListMode,
    offset: number,
    limit: number,
  ): Promise<[ChoreOccurrence[], number]> {
    const qb = this.occurrencesVisibleQueryBuilder(familyGroupId);

    if (mode.kind === 'board') {
      if (!mode.statusParam) {
        qb.andWhere('o.status = :open', {
          open: CHORE_OCCURRENCE_STATUS.OPEN,
        });
      } else {
        const bst =
          mode.statusParam === 'waiting_approval'
            ? CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL
            : mode.statusParam === 'completed'
              ? CHORE_OCCURRENCE_STATUS.COMPLETED
              : CHORE_OCCURRENCE_STATUS.OPEN;
        qb.andWhere('o.status = :bst', { bst });
      }
      if (!mode.statusParam || mode.statusParam === 'open') {
        qb.andWhere('(o.scheduledDate IS NULL OR o.scheduledDate <= :now)', {
          now: new Date(),
        });
      }
      qb.orderBy('o.createdAt', 'DESC');
    } else if (mode.kind === 'mine') {
      qb.andWhere('o.assignedToUserId = :uid', { uid: mode.userId })
        .andWhere('o.status IN (:...mine)', {
          mine: [
            CHORE_OCCURRENCE_STATUS.IN_PROGRESS,
            CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
          ],
        })
        .orderBy('o.updatedAt', 'DESC');
    } else if (mode.kind === 'pending_approval') {
      qb.andWhere('o.status = :wa', {
        wa: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      }).orderBy('o.submittedAt', 'ASC');
    } else {
      qb.andWhere('o.status IN (:...hs)', {
        hs: [
          CHORE_OCCURRENCE_STATUS.COMPLETED,
          CHORE_OCCURRENCE_STATUS.REJECTED,
        ],
      });
      if (mode.assignedUserIdOnly) {
        qb.andWhere('o.assignedToUserId = :uid', {
          uid: mode.assignedUserIdOnly,
        });
      }
      if (mode.earnedPeriodYm != null) {
        qb.andWhere('o.earnedPeriodYm = :ym', { ym: mode.earnedPeriodYm });
      }
      qb.orderBy('o.completedAt', 'DESC').addOrderBy('o.updatedAt', 'DESC');
    }

    return qb.skip(offset).take(limit).getManyAndCount();
  }

  async findOneOccurrenceVisible(
    familyGroupId: string,
    occurrenceId: string,
  ): Promise<ChoreOccurrence | null> {
    const qb = this.occurrencesVisibleQueryBuilder(familyGroupId)
      .andWhere('o.id = :id', { id: occurrenceId })
      .andWhere(
        '(o.status != :openSt OR o.scheduledDate IS NULL OR o.scheduledDate <= :now)',
        { openSt: CHORE_OCCURRENCE_STATUS.OPEN, now: new Date() },
      );
    return qb.getOne();
  }

  async saveOccurrence(
    entity: ChoreOccurrence,
    manager?: EntityManager,
  ): Promise<ChoreOccurrence> {
    return this.occ(manager).save(entity);
  }

  async findOccurrenceForStartLocked(
    occurrenceId: string,
    familyGroupId: string,
    manager: EntityManager,
  ): Promise<ChoreOccurrence | null> {
    const occRepo = this.occ(manager);
    return occRepo.findOne({
      where: {
        id: occurrenceId,
        familyGroup: { id: familyGroupId },
      },
      relations: ['definition'],
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findOccurrenceForApproveLocked(
    occurrenceId: string,
    familyGroupId: string,
    manager: EntityManager,
  ): Promise<ChoreOccurrence | null> {
    const occRepo = this.occ(manager);
    return occRepo.findOne({
      where: {
        id: occurrenceId,
        familyGroup: { id: familyGroupId },
        status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      },
      relations: ['assignedTo', 'definition'],
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findOccurrenceWaitingApproval(
    occurrenceId: string,
    familyGroupId: string,
  ): Promise<ChoreOccurrence | null> {
    return this.occurrenceEntity.findOne({
      where: {
        id: occurrenceId,
        familyGroup: { id: familyGroupId },
        status: CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL,
      },
    });
  }

  async insertOpenOccurrence(
    familyGroupId: string,
    definition: ChoreDefinition,
    scheduledDate: Date | null,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.occ(manager);
    await repo.save(
      repo.create({
        definition,
        familyGroup: { id: familyGroupId } as never,
        status: CHORE_OCCURRENCE_STATUS.OPEN,
        assignedTo: null,
        snapshotRewardMoney: null,
        snapshotCoinReward: null,
        photoBeforeUrl: null,
        photoAfterUrl: null,
        rejectionReason: null,
        approvedBy: null,
        submittedAt: null,
        approvedAt: null,
        completedAt: null,
        earnedPeriodYm: null,
        payrollSettlement: null,
        scheduledDate,
      }),
    );
  }

  async aggregatePayrollPendingByMember(
    familyGroupId: string,
    periodYm: number,
  ): Promise<ChorePayrollPendingRawRow[]> {
    return this.occurrenceEntity
      .createQueryBuilder('o')
      .select('o.assignedToUserId', 'memberId')
      .addSelect('SUM(o.snapshotRewardMoney)', 'totalPending')
      .where('o.familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('o.deletedAt IS NULL')
      .andWhere('o.status = :st', {
        st: CHORE_OCCURRENCE_STATUS.COMPLETED,
      })
      .andWhere('o.earnedPeriodYm = :ym', { ym: periodYm })
      .andWhere('o.payrollSettlementId IS NULL')
      .andWhere('o.assignedToUserId IS NOT NULL')
      .groupBy('o.assignedToUserId')
      .getRawMany<ChorePayrollPendingRawRow>();
  }

  async findPayrollSettlementByGroupAndPeriod(
    familyGroupId: string,
    periodYm: number,
  ): Promise<ChorePayrollSettlement | null> {
    return this.payrollEntity.findOne({
      where: {
        familyGroup: { id: familyGroupId },
        periodYm,
      },
    });
  }

  async findPayrollSettlementDetail(
    familyGroupId: string,
    periodYm: number,
  ): Promise<ChorePayrollSettlement | null> {
    return this.payrollEntity.findOne({
      where: {
        familyGroup: { id: familyGroupId },
        periodYm,
      },
      relations: ['lines', 'lines.member', 'settledBy'],
    });
  }

  async findPendingPayrollOccurrencesLocked(
    familyGroupId: string,
    periodYm: number,
    manager: EntityManager,
  ): Promise<ChoreOccurrence[]> {
    const occRepo = this.occ(manager);
    return occRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.assignedTo', 'assignee')
      .leftJoinAndSelect('o.approvedBy', 'approver')
      .leftJoinAndSelect('o.definition', 'definition')
      .setLock('pessimistic_write')
      .where('o.familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('o.deletedAt IS NULL')
      .andWhere('o.status = :st', {
        st: CHORE_OCCURRENCE_STATUS.COMPLETED,
      })
      .andWhere('o.earnedPeriodYm = :ym', { ym: periodYm })
      .andWhere('o.payrollSettlementId IS NULL')
      .andWhere('o.assignedToUserId IS NOT NULL')
      .getMany();
  }

  async createPayrollSettlement(
    familyGroupId: string,
    user: User,
    periodYm: number,
    manager: EntityManager,
  ): Promise<ChorePayrollSettlement> {
    const setRepo = this.payroll(manager);
    return setRepo.save(
      setRepo.create({
        familyGroup: { id: familyGroupId } as never,
        periodYm,
        settledBy: user,
        settledAt: new Date(),
      }),
    );
  }

  async createPayrollLine(
    settlement: ChorePayrollSettlement,
    memberId: string,
    amountMoney: number,
    manager: EntityManager,
  ): Promise<void> {
    const lineRepo = this.line(manager);
    await lineRepo.save(
      lineRepo.create({
        settlement,
        member: { id: memberId } as never,
        amountMoney,
      }),
    );
  }

  async linkOccurrencesToPayrollSettlement(
    occurrenceIds: string[],
    settlement: ChorePayrollSettlement,
    manager: EntityManager,
  ): Promise<void> {
    if (occurrenceIds.length === 0) {
      return;
    }
    const occRepo = this.occ(manager);
    await occRepo
      .createQueryBuilder()
      .update(ChoreOccurrence)
      .set({ payrollSettlement: settlement })
      .where('id IN (:...ids)', { ids: occurrenceIds })
      .execute();
  }

  async loadDefinitionByIdWithRelations(
    id: string,
  ): Promise<ChoreDefinition | null> {
    return this.definitionEntity.findOne({
      where: { id },
      relations: ['familyGroup', 'createdBy'],
    });
  }

  async sumPendingCoinRewards(
    familyGroupId: string,
    userId: string,
  ): Promise<number> {
    const raw = await this.occurrenceEntity
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.snapshotCoinReward), 0)', 'total')
      .where('o.familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('o.deletedAt IS NULL')
      .andWhere('o.status = :st', { st: CHORE_OCCURRENCE_STATUS.COMPLETED })
      .andWhere('o.assignedToUserId = :userId', { userId })
      .andWhere('o.snapshotCoinReward > 0')
      .andWhere('o.coinRewardCelebratedAt IS NULL')
      .getRawOne<{ total: string | null }>();

    return Number(raw?.total ?? 0);
  }

  async celebratePendingCoinRewards(
    familyGroupId: string,
    userId: string,
  ): Promise<number> {
    const total = await this.sumPendingCoinRewards(familyGroupId, userId);
    if (total <= 0) {
      return 0;
    }

    await this.occurrenceEntity
      .createQueryBuilder()
      .update(ChoreOccurrence)
      .set({ coinRewardCelebratedAt: () => 'CURRENT_TIMESTAMP' })
      .where('familyGroupId = :fg', { fg: familyGroupId })
      .andWhere('deletedAt IS NULL')
      .andWhere('status = :st', { st: CHORE_OCCURRENCE_STATUS.COMPLETED })
      .andWhere('assignedToUserId = :userId', { userId })
      .andWhere('snapshotCoinReward > 0')
      .andWhere('coinRewardCelebratedAt IS NULL')
      .execute();

    return total;
  }
}
