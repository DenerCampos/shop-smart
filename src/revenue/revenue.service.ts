import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import {
  addOneMonth,
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

@Injectable()
export class RevenueService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/revenue`;

  constructor(
    @Inject('IRevenueRepository')
    private revenueRepository: IRevenueRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private readonly coinService: CoinService,
    private readonly familyMemberResolver: FamilyMemberResolverService,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
  ) {}

  async create(
    user: User,
    createRevenueDto: CreateRevenueDto,
  ): Promise<Revenue> {
    if (!createRevenueDto.date) {
      createRevenueDto.date = new Date();
    }

    const revenue = await this.revenueRepository.create(user, createRevenueDto);

    const results = await Promise.allSettled([
      withTimeout(this.addCoins(user, 'revenue')),
    ]);

    //Log results promises
    logResultsPromises(results, ['addCoins']);

    this.eventEmitter.emit('revenue.created', { userId: user.id });

    return revenue;
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

  async update(
    revenueId: string,
    updateRevenueDto: UpdateRevenueDto,
    manager?: EntityManager,
  ): Promise<Revenue> {
    const updateRevenue = await this.revenueRepository.find(revenueId);

    if (!updateRevenue) {
      throw new UpdateException();
    }

    return this.revenueRepository.update(
      updateRevenue,
      updateRevenueDto,
      manager,
    );
  }

  async remove(revenueId: string): Promise<Revenue> {
    return this.revenueRepository.remove(revenueId);
  }

  async delete(revenueId: string): Promise<boolean> {
    return this.revenueRepository.delete(revenueId);
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
    const { revenues } = revenueRecurringConfirmDto;
    const { revenueIds } = revenueRecurringConfirmDto;

    // trocar para false a repetição de cada receita do array revenueIds
    revenueIds.forEach(async (revenueId: string) => {
      await this.updateRecurringRevenueToFalse(revenueId);
    });

    // criar as novas receitas, executado assim para não usar muitas conexões com o banco de dados (limit de 2)
    for (const revenue of revenues) {
      const currentMonth = new Date().getMonth() + 1;
      revenue.date = setSpecificMonth(revenue.date, currentMonth);
      await this.create(user, revenue);
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
