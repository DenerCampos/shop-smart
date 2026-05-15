import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { CoinService } from 'src/coin/coin.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { NotExistException } from 'src/exception/notExistException';
import { logJson } from 'src/common/logging/log-event.util';
import { CHORE_OCCURRENCE_STATUS } from './types/chore-occurrence-status.type';
import { CHORE_RECURRENCES } from './types/chore-recurrence.type';
import { ChoreDefinition } from './entities/chore-definition.entity';
import { ChoreOccurrence } from './entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from './entities/chore-payroll-settlement.entity';
import { CreateChoreDefinitionDto } from './dto/create-chore-definition.dto';
import { UpdateChoreDefinitionDto } from './dto/update-chore-definition.dto';
import { ChoreDefinitionFilterDto } from './dto/chore-definition-filter.dto';
import { ChoreOccurrenceQueryDto } from './dto/chore-occurrence-query.dto';
import { ChoreHistoryQueryDto } from './dto/chore-history-query.dto';
import { ChorePayrollPendingQueryDto } from './dto/chore-payroll-pending-query.dto';
import { IChoreRepository } from './interface/chore.repository.interface';
import {
  calcNextScheduledDate,
  type RecurringChore,
} from './utils/calc-next-scheduled-date.util';

function toPeriodYm(d: Date): number {
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

function previousPeriodYm(reference: Date): number {
  const d = new Date(
    reference.getFullYear(),
    reference.getMonth() - 1,
    1,
  );
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

@Injectable()
export class ChoreService {
  private readonly logger = new Logger(ChoreService.name);
  private choresBaseSegment = '/family-groups';

  constructor(
    @Inject('IChoreRepository')
    private readonly choreRepository: IChoreRepository,
    private readonly dataSource: DataSource,
    private readonly familyGroupService: FamilyGroupService,
    private readonly userService: UserService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly coinService: CoinService,
    private readonly pagination: Pagination,
    private readonly appConfig: AppConfig,
  ) {
    const base = this.appConfig.getBaseUrl();
    this.choresBaseSegment = `${base}/family-groups`;
  }

  private definitionsUrl(groupId: string): string {
    return `${this.choresBaseSegment}/${groupId}/chores/definitions`;
  }

  private occurrencesUrl(groupId: string): string {
    return `${this.choresBaseSegment}/${groupId}/chores/occurrences`;
  }

  async createDefinition(
    familyGroupId: string,
    user: User,
    dto: CreateChoreDefinitionDto,
  ): Promise<ChoreDefinition> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const def = await this.dataSource.transaction(async (manager) => {
      const definition = await this.choreRepository.createDefinitionEntity(
        familyGroupId,
        user,
        dto,
        manager,
      );
      await this.choreRepository.createInitialOpenOccurrence(
        familyGroupId,
        definition,
        manager,
      );
      return definition;
    });

    return this.loadDefinition(def.id);
  }

  async listDefinitions(
    familyGroupId: string,
    user: User,
    query: ChoreDefinitionFilterDto,
  ): Promise<paginationData<ChoreDefinition>> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const [rows, total] = await this.choreRepository.findDefinitionsPage(
      familyGroupId,
      offset,
      limit,
    );

    return this.pagination.paginateData<ChoreDefinition>(
      rows,
      page,
      limit,
      total,
      this.definitionsUrl(familyGroupId),
    );
  }

  async updateDefinition(
    familyGroupId: string,
    user: User,
    definitionId: string,
    dto: UpdateChoreDefinitionDto,
  ): Promise<ChoreDefinition> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const def = await this.choreRepository.findDefinitionByIdAndGroupWithRelations(
      definitionId,
      familyGroupId,
    );

    if (!def || def.deletedAt) {
      throw new NotExistException();
    }

    Object.assign(def, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.rewardValue !== undefined ? { rewardValue: dto.rewardValue } : {}),
      ...(dto.coinReward !== undefined ? { coinReward: dto.coinReward } : {}),
      ...(dto.requirePhoto !== undefined
        ? { requirePhoto: dto.requirePhoto }
        : {}),
      ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    await this.choreRepository.saveDefinition(def);

    return this.loadDefinition(def.id);
  }

  async deleteDefinition(
    familyGroupId: string,
    user: User,
    definitionId: string,
  ): Promise<void> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const def = await this.choreRepository.findDefinitionByIdAndGroupWithRelations(
      definitionId,
      familyGroupId,
    );

    if (!def || def.deletedAt) {
      throw new NotExistException();
    }

    await this.choreRepository.softRemoveDefinition(def);
  }

  async listOccurrences(
    familyGroupId: string,
    user: User,
    query: ChoreOccurrenceQueryDto,
  ): Promise<paginationData<ChoreOccurrence>> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const [rows, total] = await this.choreRepository.findOccurrencesPage(
      familyGroupId,
      { kind: 'board', statusParam: query.status },
      offset,
      limit,
    );

    return this.pagination.paginateData<ChoreOccurrence>(
      rows,
      page,
      limit,
      total,
      this.occurrencesUrl(familyGroupId),
    );
  }

  async listMine(
    familyGroupId: string,
    user: User,
    query: ChoreOccurrenceQueryDto,
  ): Promise<paginationData<ChoreOccurrence>> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const [rows, total] = await this.choreRepository.findOccurrencesPage(
      familyGroupId,
      { kind: 'mine', userId: user.id },
      offset,
      limit,
    );

    return this.pagination.paginateData(
      rows,
      page,
      limit,
      total,
      `${this.occurrencesUrl(familyGroupId)}/mine`,
    );
  }

  async listPendingApproval(
    familyGroupId: string,
    user: User,
    query: ChoreOccurrenceQueryDto,
  ): Promise<paginationData<ChoreOccurrence>> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const [rows, total] = await this.choreRepository.findOccurrencesPage(
      familyGroupId,
      { kind: 'pending_approval' },
      offset,
      limit,
    );

    return this.pagination.paginateData(
      rows,
      page,
      limit,
      total,
      `${this.occurrencesUrl(familyGroupId)}/pending-approval`,
    );
  }

  async listHistory(
    familyGroupId: string,
    user: User,
    query: ChoreHistoryQueryDto,
    isAdmin: boolean,
  ): Promise<paginationData<ChoreOccurrence>> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const earnedPeriodYm =
      query.year != null && query.month != null
        ? query.year * 100 + query.month
        : undefined;

    const [rows, total] = await this.choreRepository.findOccurrencesPage(
      familyGroupId,
      {
        kind: 'history',
        assignedUserIdOnly: isAdmin ? undefined : user.id,
        earnedPeriodYm,
      },
      offset,
      limit,
    );

    return this.pagination.paginateData(
      rows,
      page,
      limit,
      total,
      `${this.occurrencesUrl(familyGroupId)}/history`,
    );
  }

  async startOccurrence(
    familyGroupId: string,
    user: User,
    occurrenceId: string,
  ): Promise<ChoreOccurrence> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    await this.dataSource.transaction(async (manager) => {
      const occ = await this.choreRepository.findOccurrenceForStartLocked(
        occurrenceId,
        familyGroupId,
        manager,
      );

      if (!occ || occ.deletedAt) {
        throw new NotExistException();
      }

      if (occ.definition.deletedAt || !occ.definition.isActive) {
        throw new ConflictException('Esta tarefa não está mais disponível.');
      }

      if (occ.status !== CHORE_OCCURRENCE_STATUS.OPEN) {
        throw new ConflictException(
          'Esta tarefa já foi iniciada por outro membro.',
        );
      }

      occ.status = CHORE_OCCURRENCE_STATUS.IN_PROGRESS;
      occ.assignedTo = user;
      occ.snapshotRewardMoney = Number(occ.definition.rewardValue);
      occ.snapshotCoinReward = Number(occ.definition.coinReward ?? 0);

      await this.choreRepository.saveOccurrence(occ, manager);
    });

    return this.loadOccurrence(occurrenceId, familyGroupId);
  }

  async uploadPhotos(
    familyGroupId: string,
    user: User,
    occurrenceId: string,
    before?: Express.Multer.File | undefined,
    after?: Express.Multer.File | undefined,
  ): Promise<ChoreOccurrence> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const occ = await this.loadOccurrenceWritable(
      occurrenceId,
      familyGroupId,
      user.id,
    );

    if (
      !before &&
      !after &&
      !occ.photoBeforeUrl &&
      !occ.photoAfterUrl
    ) {
      throw new BadRequestException(
        'Envie ao menos uma imagem (before ou after). Você pode enviar uma por vez.',
      );
    }

    if (before) {
      occ.photoBeforeUrl = await this.uploadChorePhoto(
        before,
        occurrenceId,
        'before',
      );
    }

    if (after) {
      occ.photoAfterUrl = await this.uploadChorePhoto(
        after,
        occurrenceId,
        'after',
      );
    }

    await this.choreRepository.saveOccurrence(occ);

    return this.loadOccurrence(occurrenceId, familyGroupId);
  }

  async submitOccurrence(
    familyGroupId: string,
    user: User,
    occurrenceId: string,
  ): Promise<ChoreOccurrence> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const occ = await this.loadOccurrenceWritable(
      occurrenceId,
      familyGroupId,
      user.id,
    );

    if (occ.definition.requirePhoto) {
      if (!occ.photoBeforeUrl || !occ.photoAfterUrl) {
        throw new BadRequestException(
          'Envie foto antes e depois antes de submeter.',
        );
      }
    }

    occ.status = CHORE_OCCURRENCE_STATUS.WAITING_APPROVAL;
    occ.submittedAt = new Date();
    await this.choreRepository.saveOccurrence(occ);

    return this.loadOccurrence(occurrenceId, familyGroupId);
  }

  async approveOccurrence(
    familyGroupId: string,
    user: User,
    occurrenceId: string,
  ): Promise<ChoreOccurrence> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    let snapshotCoins = 0;
    let snapshotMoney: number | null = null;

    await this.dataSource.transaction(async (manager) => {
      const occ = await this.choreRepository.findOccurrenceForApproveLocked(
        occurrenceId,
        familyGroupId,
        manager,
      );

      if (!occ || occ.deletedAt) {
        throw new NotExistException();
      }

      const assigneeId = occ.assignedTo?.id;
      if (!assigneeId) {
        throw new BadRequestException(
          'Não há membro associado para receber moedas desta ocorrência.',
        );
      }

      const now = new Date();

      occ.status = CHORE_OCCURRENCE_STATUS.COMPLETED;
      occ.approvedBy = user;
      occ.approvedAt = now;
      occ.completedAt = now;
      occ.earnedPeriodYm = toPeriodYm(now);
      snapshotCoins =
        occ.snapshotCoinReward != null ? Number(occ.snapshotCoinReward) : 0;
      snapshotMoney =
        occ.snapshotRewardMoney != null ? Number(occ.snapshotRewardMoney) : null;

      await this.choreRepository.saveOccurrence(occ, manager);
    });

    const fresh = await this.loadOccurrence(occurrenceId, familyGroupId);

    const assigneeId = fresh.assignedTo?.id;
    if (!assigneeId) {
      return fresh;
    }

    const assigneeUser = await this.userService.find(assigneeId);
    if (!assigneeUser) {
      throw new NotExistException();
    }

    await this.coinService.addEarnedCoinsByAmount(
      assigneeUser,
      snapshotCoins,
      'Recompensa por tarefa doméstica aprovada',
    );

    logJson(this.logger, {
      event: 'chore_approved',
      occurrenceId,
      familyGroupId,
      assigneeUserId: assigneeId,
      rewardMoney: snapshotMoney,
      coinReward: snapshotCoins,
    });

    const defFresh = await this.choreRepository.findDefinitionById(
      fresh.definition.id,
    );

    if (
      defFresh &&
      !defFresh.deletedAt &&
      defFresh.isActive &&
      defFresh.recurrence !== CHORE_RECURRENCES.ONCE
    ) {
      const approvedAt = fresh.approvedAt ?? new Date();
      const scheduledDate = calcNextScheduledDate(
        fresh.createdAt,
        defFresh.recurrence as RecurringChore,
        approvedAt,
      );
      await this.spawnOpenOccurrence(
        familyGroupId,
        defFresh,
        scheduledDate,
      );
    }

    return this.loadOccurrence(occurrenceId, familyGroupId);
  }

  async rejectOccurrence(
    familyGroupId: string,
    user: User,
    occurrenceId: string,
    reason: string,
  ): Promise<ChoreOccurrence> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const occ = await this.choreRepository.findOccurrenceWaitingApproval(
      occurrenceId,
      familyGroupId,
    );

    if (!occ || occ.deletedAt) {
      throw new NotExistException();
    }

    occ.status = CHORE_OCCURRENCE_STATUS.REJECTED;
    occ.rejectionReason = reason.trim();
    occ.approvedBy = user;
    occ.earnedPeriodYm = toPeriodYm(new Date());

    await this.choreRepository.saveOccurrence(occ);

    return this.loadOccurrence(occurrenceId, familyGroupId);
  }

  async getPayrollSuggestion(
    familyGroupId: string,
    user: User,
  ): Promise<{
    suggestedPeriodYm: number;
    suggestedCloseDate: string;
    message: string;
  }> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const now = new Date();
    const suggestedPeriodYm = previousPeriodYm(now);
    const fd = new Date(now.getFullYear(), now.getMonth(), 1);
    const suggestedCloseDate = fd.toISOString();

    return {
      suggestedPeriodYm,
      suggestedCloseDate,
      message:
        'Recomendamos registrar o pagamento das tarefas aprovadas do mês anterior até o dia 1 do mês corrente.',
    };
  }

  async getPayrollPending(
    familyGroupId: string,
    user: User,
    query: ChorePayrollPendingQueryDto,
    isAdmin: boolean,
  ): Promise<{
    periodYm: number;
    members: { totalPending: number; memberId: string }[];
  }> {
    await this.familyGroupService.assertAcceptedMembership(familyGroupId, user.id);

    const ref = new Date();
    const periodYm =
      query.year != null && query.month != null
        ? query.year * 100 + query.month
        : toPeriodYm(ref);

    const raw = await this.choreRepository.aggregatePayrollPendingByMember(
      familyGroupId,
      periodYm,
    );

    let filtered = raw.map((r) => ({
      memberId: r.memberId,
      totalPending: Number(r.totalPending ?? 0),
    }));

    if (!isAdmin) {
      filtered = filtered.filter((m) => m.memberId === user.id);
    }

    return { periodYm, members: filtered };
  }

  async settlePayroll(
    familyGroupId: string,
    user: User,
    periodYm: number,
  ): Promise<ChorePayrollSettlement> {
    await this.familyGroupService.assertFamilyAdmin(familyGroupId, user.id);

    const existing =
      await this.choreRepository.findPayrollSettlementByGroupAndPeriod(
        familyGroupId,
        periodYm,
      );

    if (existing) {
      throw new ConflictException('Este período já foi liquidado.');
    }

    return this.dataSource.transaction(async (manager) => {
      const pending =
        await this.choreRepository.findPendingPayrollOccurrencesLocked(
          familyGroupId,
          periodYm,
          manager,
        );

      if (pending.length === 0) {
        throw new ConflictException(
          'Não há valores pendentes de mesada neste período.',
        );
      }

      const byUser = new Map<string, number>();
      for (const o of pending) {
        const uid = o.assignedTo?.id;
        if (!uid) {
          continue;
        }
        const add = Number(o.snapshotRewardMoney ?? 0);
        byUser.set(uid, (byUser.get(uid) ?? 0) + add);
      }

      const settlement = await this.choreRepository.createPayrollSettlement(
        familyGroupId,
        user,
        periodYm,
        manager,
      );

      for (const [memberId, amount] of byUser) {
        await this.choreRepository.createPayrollLine(
          settlement,
          memberId,
          amount,
          manager,
        );
      }

      await this.choreRepository.linkOccurrencesToPayrollSettlement(
        pending.map((p) => p.id),
        settlement,
        manager,
      );

      return settlement;
    });
  }

  private async spawnOpenOccurrence(
    familyGroupId: string,
    definition: ChoreDefinition,
    scheduledDate: Date,
  ): Promise<void> {
    await this.choreRepository.insertOpenOccurrence(
      familyGroupId,
      definition,
      scheduledDate,
    );
  }

  async loadDefinition(id: string): Promise<ChoreDefinition> {
    const def = await this.choreRepository.loadDefinitionByIdWithRelations(id);

    if (!def || def.deletedAt) {
      throw new NotExistException();
    }

    return def;
  }

  async loadOccurrence(
    occurrenceId: string,
    familyGroupId: string,
  ): Promise<ChoreOccurrence> {
    const occ = await this.choreRepository.findOneOccurrenceVisible(
      familyGroupId,
      occurrenceId,
    );

    if (!occ) {
      throw new NotExistException();
    }

    return occ;
  }

  private async loadOccurrenceWritable(
    occurrenceId: string,
    familyGroupId: string,
    userId: string,
  ): Promise<ChoreOccurrence> {
    const occ = await this.loadOccurrence(occurrenceId, familyGroupId);

    if (occ.status !== CHORE_OCCURRENCE_STATUS.IN_PROGRESS) {
      throw new ConflictException('Esta ocorrência não está em execução.');
    }

    const assigneeId = occ.assignedTo?.id;
    if (!assigneeId || assigneeId !== userId) {
      throw new ForbiddenException();
    }

    return occ;
  }

  private async uploadChorePhoto(
    file: Express.Multer.File,
    occurrenceId: string,
    kind: 'before' | 'after',
  ): Promise<string> {
    const imageRegex = /^image\/(jpg|jpeg|png|gif|webp)$/;
    if (!imageRegex.test(file.mimetype)) {
      throw new BadRequestException(
        'Apenas imagens (jpg, jpeg, png, gif, webp) são permitidas.',
      );
    }

    const ext = this.pickExtension(file.originalname);

    const fileName = `chore_${occurrenceId}_${kind}_${uuidv4()}${ext}`;

    const uploadResult = await this.googleDriveService.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
      'chore',
    );

    return uploadResult.webContentLink;
  }

  private pickExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '.jpg';
  }
}
