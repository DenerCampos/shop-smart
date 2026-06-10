import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { randomUUID } from 'node:crypto';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import {
  getCurrentDay,
  getCurrentMonth,
  getCurrentMonthDates,
  getPreviousMonth,
  getPreviousMonthDates,
  setSpecificMonth,
} from 'src/common/utils/dates.util';
import { GetValueRevenueCurrentDto } from './dto/get-value-revenue-current.dto';
import { IRevenueRepository } from './interface/revenue.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { User } from 'src/user/entities/user.entity';
import { Revenue } from './entities/revenue.entity';
import { RevenueListDto } from './dto/revenue-list.dto';
import { EntityManager } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import {
  logResultsPromises,
  withTimeout,
} from 'src/common/utils/helpPromises.util';
import { CoinService } from 'src/coin/coin.service';
import { coinType } from 'src/coin/types/coinType';
import { RevenueRecurringConfirmDto } from './dto/revenue-recurring-confirm.dto';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { InstallmentPlannerService } from 'src/common/installment/installment-planner.service';
import type { ResolvedInstallmentMeta } from 'src/common/installment/installment-planner.service';
import type { RecurrenceConfigDto } from 'src/common/installment/installment.types';
import {
  buildInstallmentLabel,
  buildRecurrenceResponseFromExpense,
  computeReceiptAmounts,
  MAX_PHOTOS_PER_FINANCIAL,
  toInstallmentCalendarDate,
} from 'src/common/installment/installment.util';
import { FILE_STORAGE } from 'src/file-storage/file-storage.constants';
import { IFileStorageService } from 'src/file-storage/interfaces/file-storage.interface';
import { NotExistException } from 'src/exception/notExistException';
import { RevenueReceiptDto } from 'src/common/dto/financial-receipt.dto';

@Injectable()
export class RevenueService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/revenue`;
  private readonly imageMimeRegex = /^image\/(jpg|jpeg|png|gif|webp)$/;

  constructor(
    @Inject('IRevenueRepository')
    private revenueRepository: IRevenueRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private readonly coinService: CoinService,
    private readonly familyMemberResolver: FamilyMemberResolverService,
    private readonly queryRunnerFactory: QueryRunnerFactory,
    private readonly installmentPlanner: InstallmentPlannerService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorageService,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
  ) {}

  async create(
    user: User,
    createRevenueDto: CreateRevenueDto,
  ): Promise<Revenue> {
    if (
      this.installmentPlanner.isFiniteInstallment(createRevenueDto.recurrence)
    ) {
      return this.createFiniteInstallmentRevenues(user, createRevenueDto);
    }
    return this.createSingleRevenueRecord(user, createRevenueDto, 1);
  }

  private async createFiniteInstallmentRevenues(
    user: User,
    dto: CreateRevenueDto,
  ): Promise<Revenue> {
    const recurrence = dto.recurrence as RecurrenceConfigDto;
    const schedule = this.installmentPlanner.buildFiniteSchedule(
      toInstallmentCalendarDate(new Date(dto.date ?? new Date())),
      dto.value,
      recurrence,
    );
    const groupId = randomUUID();
    let first: Revenue | null = null;

    await this.queryRunnerFactory.startTransaction();
    try {
      for (const slice of schedule) {
        const meta: ResolvedInstallmentMeta = {
          installmentGroupId: groupId,
          installmentNumber: slice.installmentNumber,
          totalInstallments: recurrence.count ?? schedule.length,
          isInstallment: true,
          repeat: false,
        };
        const revenue = await this.persistRevenue(
          user,
          { ...dto, value: slice.value, date: slice.date },
          meta,
          this.queryRunnerFactory.manager,
        );
        if (slice.installmentNumber === 1) first = revenue;
      }
      await this.queryRunnerFactory.commitTransaction();
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw error;
    }

    if (!first) throw new Error('Falha ao criar parcelas');
    await this.afterRevenueCreated(user);
    return first;
  }

  private async createSingleRevenueRecord(
    user: User,
    dto: CreateRevenueDto,
    installmentNumber: number,
  ): Promise<Revenue> {
    const meta = this.installmentPlanner.resolveMeta(
      dto.recurrence,
      dto.repeat,
      installmentNumber,
    );
    const revenue = await this.persistRevenue(user, dto, meta);
    await this.afterRevenueCreated(user);
    return revenue;
  }

  private resolveRevenueAmount(
    value: number | undefined,
    fallback?: number,
  ): number {
    const parsed =
      value != null && Number.isFinite(Number(value))
        ? Number(Number(value).toFixed(2))
        : fallback;

    if (parsed == null || Number.isNaN(parsed)) {
      throw new BadRequestException('Valor da receita é obrigatório');
    }

    if (parsed < 0) {
      throw new BadRequestException(
        'Valor da receita deve ser maior ou igual a zero',
      );
    }

    return parsed;
  }

  private async persistRevenue(
    user: User,
    dto: CreateRevenueDto,
    meta: ResolvedInstallmentMeta,
    manager?: EntityManager,
  ): Promise<Revenue> {
    const payload = this.installmentPlanner.mergeInstallmentFields(
      {
        name: dto.name,
        value: this.resolveRevenueAmount(dto.value),
        date: dto.date ?? new Date(),
      },
      meta,
      [],
    );
    return this.revenueRepository.create(
      user,
      { ...dto, ...payload } as CreateRevenueDto,
      manager,
    );
  }

  private async afterRevenueCreated(user: User): Promise<void> {
    const results = await Promise.allSettled([
      withTimeout(this.addCoins(user, 'revenue')),
    ]);
    logResultsPromises(results, ['addCoins']);
    this.eventEmitter.emit('revenue.created', { userId: user.id });
  }

  /** Liquidação de mesada — sem moedas nem eventos de missão. */
  async createPayrollRevenue(
    user: User,
    params: { name: string; value: number; date: Date },
    manager?: EntityManager,
  ): Promise<Revenue> {
    return this.revenueRepository.create(
      user,
      {
        name: params.name,
        value: params.value,
        repeat: false,
        date: params.date,
      },
      manager,
    );
  }

  private async addCoins(user: User, typeCoins: coinType): Promise<void> {
    await this.coinService.addCoins(user, { type: typeCoins });
  }

  async findAll(
    userList: RevenueListDto,
    user: User,
  ): Promise<paginationData<Revenue>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const { userIds } = await this.familyMemberResolver.resolve(user.id);

    const [revenues, total] = await this.revenueRepository.findAll(
      userIds,
      offset,
      userList.limit,
      userList.search,
      userList.isRecurring,
      userList.isInstallment,
    );

    const paginateData = this.pagination.paginateData<Revenue>(
      revenues,
      userList.page,
      userList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(revenueId: string): Promise<Revenue | null> {
    return this.revenueRepository.find(revenueId);
  }

  async findForEdit(revenueId: string): Promise<Revenue | null> {
    const revenue = await this.revenueRepository.find(revenueId);
    if (!revenue) return null;

    if (
      revenue.installmentGroupId &&
      revenue.installmentNumber !== 1 &&
      revenue.isInstallment
    ) {
      const root = await this.revenueRepository.findInstallmentRoot(
        revenue.installmentGroupId,
      );
      if (root) {
        revenue.photos = root.photos ?? [];
      }
    }

    return revenue;
  }

  async mapForResponse(revenue: Revenue): Promise<
    Revenue & {
      installmentLabel: string | null;
      recurrence: ReturnType<typeof buildRecurrenceResponseFromExpense>;
    }
  > {
    let groupMembers: Revenue[] = [];
    if (revenue.installmentGroupId) {
      groupMembers = await this.revenueRepository.findByInstallmentGroup(
        revenue.installmentGroupId,
      );
    }

    return {
      ...revenue,
      installmentLabel: buildInstallmentLabel(
        revenue.installmentNumber,
        revenue.totalInstallments,
      ),
      recurrence: buildRecurrenceResponseFromExpense(revenue, groupMembers),
    };
  }

  mapSummaryForResponse(revenue: Revenue): Revenue & {
    installmentLabel: string | null;
  } {
    return {
      ...revenue,
      installmentLabel: buildInstallmentLabel(
        revenue.installmentNumber,
        revenue.totalInstallments,
      ),
    };
  }

  async update(
    revenueId: string,
    updateRevenueDto: UpdateRevenueDto,
    manager?: EntityManager,
  ): Promise<Revenue> {
    const revenue = await this.revenueRepository.find(revenueId);
    if (!revenue) {
      throw new UpdateException();
    }

    const root = await this.resolveInstallmentRoot(revenue);
    const { recurrence, ...rawFields } = updateRevenueDto;
    const totalValue = this.resolveRevenueAmount(
      rawFields.value,
      Number(root.value),
    );

    const meta = this.installmentPlanner.resolveMetaForUpdate(
      recurrence,
      rawFields.repeat ?? root.repeat,
      root,
      root.installmentNumber ?? 1,
    );

    const editingInstallmentNumber = revenue.installmentNumber ?? 1;

    const sharedFields = {
      name: rawFields.name ?? root.name,
      date: rawFields.date ?? root.date,
      repeat: rawFields.repeat ?? root.repeat,
    };

    if (this.installmentPlanner.isFiniteInstallment(recurrence)) {
      await this.syncFiniteInstallmentGroupOnUpdate(
        root,
        editingInstallmentNumber,
        revenue.user,
        sharedFields,
        totalValue,
        recurrence as RecurrenceConfigDto,
        manager,
      );
    } else {
      const installmentPayload = this.installmentPlanner.mergeInstallmentFields(
        {},
        meta,
        root.photos ?? [],
      );

      await this.revenueRepository.update(
        root,
        {
          ...root,
          ...sharedFields,
          value: totalValue,
          ...installmentPayload,
        },
        manager,
      );

      if (
        root.installmentGroupId &&
        recurrence?.enabled &&
        recurrence.mode === 'installment_infinite'
      ) {
        await this.syncInstallmentMetaOnGroup(
          root.installmentGroupId,
          meta,
          manager,
        );
      }

      if (
        root.installmentGroupId &&
        (!recurrence?.enabled || recurrence.mode === 'none') &&
        !sharedFields.repeat
      ) {
        await this.removeExtraInstallmentMembers(root, manager);
      }
    }

    const updated = await this.findForEdit(revenueId);
    if (!updated) throw new UpdateException();
    return updated;
  }

  private async resolveInstallmentRoot(revenue: Revenue): Promise<Revenue> {
    if (revenue.installmentGroupId && revenue.installmentNumber !== 1) {
      const root = await this.revenueRepository.findInstallmentRoot(
        revenue.installmentGroupId,
      );
      return root ?? revenue;
    }
    return revenue;
  }

  private async syncFiniteInstallmentGroupOnUpdate(
    root: Revenue,
    preserveDatesUpToInstallment: number,
    user: User,
    fields: { name: string; date: Date; repeat?: boolean },
    totalValue: number,
    recurrence: RecurrenceConfigDto,
    manager?: EntityManager,
  ): Promise<void> {
    const groupId = root.installmentGroupId ?? randomUUID();
    const schedule = this.installmentPlanner.buildFiniteSchedule(
      toInstallmentCalendarDate(root.date),
      totalValue,
      recurrence,
    );
    const totalCount = recurrence.count ?? schedule.length;
    const existing = root.installmentGroupId
      ? await this.revenueRepository.findByInstallmentGroup(groupId)
      : [root];

    for (const slice of schedule) {
      const sliceMeta: ResolvedInstallmentMeta = {
        installmentGroupId: groupId,
        installmentNumber: slice.installmentNumber,
        totalInstallments: totalCount,
        isInstallment: true,
        repeat: false,
      };
      const member = existing.find(
        (entry) => entry.installmentNumber === slice.installmentNumber,
      );
      const installmentPayload = this.installmentPlanner.mergeInstallmentFields(
        {},
        sliceMeta,
        slice.installmentNumber === 1 ? (root.photos ?? []) : [],
      );
      const shouldPreserveDate =
        !!member && slice.installmentNumber <= preserveDatesUpToInstallment;
      const patch = {
        name: fields.name,
        value: slice.value,
        date: shouldPreserveDate
          ? member.date
          : toInstallmentCalendarDate(slice.date),
        repeat: false,
        ...installmentPayload,
      };

      if (member) {
        await this.revenueRepository.update(
          member,
          { ...member, ...patch },
          manager,
        );
      } else {
        await this.persistRevenue(
          user,
          patch as CreateRevenueDto,
          sliceMeta,
          manager,
        );
      }
    }

    for (const member of existing) {
      if ((member.installmentNumber ?? 0) > schedule.length) {
        await this.revenueRepository.delete(member.id);
      }
    }
  }

  private async syncInstallmentMetaOnGroup(
    groupId: string,
    meta: ResolvedInstallmentMeta,
    manager?: EntityManager,
  ): Promise<void> {
    const members =
      await this.revenueRepository.findByInstallmentGroup(groupId);
    for (const member of members) {
      await this.revenueRepository.update(
        member,
        {
          ...member,
          repeat: meta.repeat,
          totalInstallments: meta.totalInstallments,
          isInstallment: meta.isInstallment,
          installmentGroupId: meta.installmentGroupId,
        } as UpdateRevenueDto,
        manager,
      );
    }
  }

  private async removeExtraInstallmentMembers(
    root: Revenue,
    manager?: EntityManager,
  ): Promise<void> {
    if (!root.installmentGroupId) return;

    const members = await this.revenueRepository.findByInstallmentGroup(
      root.installmentGroupId,
    );

    for (const member of members) {
      if (member.id === root.id) {
        await this.revenueRepository.update(
          member,
          {
            ...member,
            installmentGroupId: null,
            installmentNumber: null,
            totalInstallments: null,
            isInstallment: false,
            repeat: false,
          } as UpdateRevenueDto,
          manager,
        );
      } else {
        await this.revenueRepository.delete(member.id);
      }
    }
  }

  async remove(revenueId: string): Promise<Revenue> {
    return this.revenueRepository.remove(revenueId);
  }

  async delete(revenueId: string, deleteGroup = false): Promise<boolean> {
    const revenue = await this.revenueRepository.find(revenueId);
    if (!revenue) return false;

    if (deleteGroup && revenue.installmentGroupId) {
      const group = await this.revenueRepository.findByInstallmentGroup(
        revenue.installmentGroupId,
      );
      for (const member of group) {
        await this.revenueRepository.delete(member.id);
      }
      return true;
    }

    return this.revenueRepository.delete(revenueId);
  }

  async getReceipt(
    revenueId: string,
    userId: string,
  ): Promise<RevenueReceiptDto> {
    const revenue = await this.revenueRepository.find(revenueId);
    if (!revenue) throw new NotExistException();
    if (revenue.user?.id !== userId) throw new ForbiddenException();

    let photos = revenue.photos ?? [];
    let groupMembers: Revenue[] = [];

    if (revenue.installmentGroupId) {
      groupMembers = await this.revenueRepository.findByInstallmentGroup(
        revenue.installmentGroupId,
      );
    }

    if (revenue.installmentGroupId && revenue.installmentNumber !== 1) {
      const root = await this.revenueRepository.findInstallmentRoot(
        revenue.installmentGroupId,
      );
      if (root) photos = root.photos ?? [];
    }

    const { installmentValue, totalValue } = computeReceiptAmounts(
      revenue,
      groupMembers,
    );

    return {
      id: revenue.id,
      type: 'revenue',
      name: revenue.name,
      value: installmentValue,
      installmentValue,
      totalValue,
      date: revenue.date,
      photos,
      installment: {
        installmentNumber: revenue.installmentNumber,
        totalInstallments: revenue.totalInstallments,
        installmentGroupId: revenue.installmentGroupId,
        isInstallment: revenue.isInstallment,
        installmentLabel: buildInstallmentLabel(
          revenue.installmentNumber,
          revenue.totalInstallments,
        ),
      },
      user: revenue.user,
    };
  }

  private async getPhotoTargetRevenue(
    revenueId: string,
    userId: string,
  ): Promise<Revenue> {
    const revenue = await this.revenueRepository.find(revenueId);
    if (!revenue) throw new NotExistException();
    if (revenue.user?.id !== userId) throw new ForbiddenException();
    if (revenue.installmentGroupId && revenue.installmentNumber !== 1) {
      const root = await this.revenueRepository.findInstallmentRoot(
        revenue.installmentGroupId,
      );
      if (root) return root;
    }
    return revenue;
  }

  async uploadPhoto(
    revenueId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Revenue> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }
    if (!this.imageMimeRegex.test(file.mimetype)) {
      throw new BadRequestException(
        'Apenas imagens (jpg, jpeg, png, gif, webp) são permitidas',
      );
    }

    const revenue = await this.getPhotoTargetRevenue(revenueId, userId);
    const photos = revenue.photos ?? [];
    if (photos.length >= MAX_PHOTOS_PER_FINANCIAL) {
      throw new BadRequestException(
        `Limite de ${MAX_PHOTOS_PER_FINANCIAL} fotos por receita.`,
      );
    }

    const ext =
      file.originalname
        ?.split('.')
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const fileName = `revenue-${randomUUID()}.${ext.length > 8 ? 'jpg' : ext}`;
    const uploaded = await this.fileStorage.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
      'revenue',
    );

    return this.revenueRepository.save({
      ...revenue,
      photos: [...photos, uploaded.webContentLink],
    });
  }

  async removePhoto(
    revenueId: string,
    photoUrl: string,
    userId: string,
  ): Promise<Revenue> {
    const revenue = await this.getPhotoTargetRevenue(revenueId, userId);
    const photos = revenue.photos ?? [];
    if (!photos.includes(photoUrl)) {
      throw new BadRequestException('Foto não encontrada nesta receita');
    }

    try {
      const fileId = this.fileStorage.extractFileIdFromUrl(photoUrl);
      if (fileId) await this.fileStorage.deleteFile(fileId);
    } catch {
      /* ignore */
    }

    return this.revenueRepository.save({
      ...revenue,
      photos: photos.filter((u) => u !== photoUrl),
    });
  }

  async getByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Revenue[]> {
    return this.revenueRepository.findByPeriod(userId, startDate, endDate);
  }

  async getAllByCurrentMonth(user: User): Promise<Revenue[] | []> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    return this.revenueRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );
  }

  async getRevenueByCurrentMonth(
    user: User,
  ): Promise<GetValueRevenueCurrentDto> {
    const { startDateString, endDateString } = getCurrentMonthDates();
    return this.sumRevenuesByPeriod(user.id, startDateString, endDateString);
  }

  async getRevenueByPreviousMonth(
    user: User,
  ): Promise<GetValueRevenueCurrentDto> {
    const { startDateString, endDateString } = getPreviousMonthDates();
    return this.sumRevenuesByPeriod(user.id, startDateString, endDateString);
  }

  private async sumRevenuesByPeriod(
    userId: string,
    startDateString: string,
    endDateString: string,
  ): Promise<GetValueRevenueCurrentDto> {
    const revenues = await this.revenueRepository.findByPeriod(
      userId,
      startDateString,
      endDateString,
    );

    if (!revenues || !Array.isArray(revenues) || revenues.length === 0) {
      return { value: 0 };
    }

    let total = 0;
    revenues.forEach((revenue: Revenue) => {
      const value = Number(revenue.value) || 0;
      total += value;
    });

    return {
      value: Number((Math.ceil(total * 100) / 100).toFixed(2)),
    };
  }

  async isUserNewMonth(user: User): Promise<boolean> {
    const month = getCurrentMonth();
    const revenues = await this.revenueRepository.findByMonth(user.id, month);

    return revenues.length === 0;
  }

  async getAllByPreviousMonth(user: User): Promise<Revenue[] | []> {
    const month = getPreviousMonth();
    return await this.revenueRepository.findByMonth(user.id, month);
  }

  async exist(user: User): Promise<boolean> {
    return this.revenueRepository.exist(user.id);
  }

  async getLatest(
    userIds: string[],
    limit = this.limitDefault,
  ): Promise<Revenue[] | []> {
    return this.revenueRepository.getLatest(userIds, limit);
  }

  async countByUser(userIds: string[]): Promise<number> {
    return this.revenueRepository.countByUser(userIds);
  }

  async getRecurringRevenueByCurrentMonth(user: User): Promise<Revenue[] | []> {
    const month = getPreviousMonth();
    const day = getCurrentDay();

    return this.revenueRepository.findRecurringByMonthAndDay(
      user.id,
      month,
      day,
    );
  }

  async updateRecurringRevenueToFalse(revenueId: string): Promise<void> {
    const revenue = await this.revenueRepository.find(revenueId);
    await this.revenueRepository.update(revenue, {
      ...revenue,
      repeat: false,
    });
  }

  async recurringConfirm(
    user: User,
    revenueRecurringConfirmDto: RevenueRecurringConfirmDto,
  ): Promise<void> {
    const { revenues, revenueIds } = revenueRecurringConfirmDto;

    for (const revenueId of revenueIds) {
      await this.updateRecurringRevenueToFalse(revenueId);
    }

    for (let i = 0; i < revenues.length; i++) {
      const revenueDto = revenues[i];
      const sourceId = revenueIds[i];
      const source = sourceId
        ? await this.revenueRepository.find(sourceId)
        : null;

      const currentMonth = new Date().getMonth() + 1;
      revenueDto.date = setSpecificMonth(revenueDto.date, currentMonth);

      if (
        source?.isInstallment &&
        source.totalInstallments == null &&
        source.installmentGroupId
      ) {
        const nextNumber =
          this.installmentPlanner.nextInfiniteInstallmentNumber(
            source.installmentNumber,
          );
        const meta: ResolvedInstallmentMeta = {
          installmentGroupId: source.installmentGroupId,
          installmentNumber: nextNumber,
          totalInstallments: null,
          isInstallment: true,
          repeat: true,
        };
        await this.persistRevenue(user, revenueDto, meta);
        await this.afterRevenueCreated(user);
      } else {
        revenueDto.repeat = source?.repeat ?? false;
        await this.create(user, revenueDto);
      }
    }
  }

  async hasRecurringPreviousMonth(user: User): Promise<boolean> {
    const revenues = await this.revenueRepository.findRecurringByMonthAndDay(
      user.id,
      getPreviousMonth(),
      getCurrentDay(),
    );

    return revenues.length > 0;
  }
}
