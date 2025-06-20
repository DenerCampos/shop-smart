import { Inject, Injectable } from '@nestjs/common';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import {
  getCurrentMonth,
  getCurrentMonthDates,
  getPreviousMonth,
} from 'src/common/utils/dates';
import { GetValueRevenueCurrentDto } from './dto/get-value-revenue-current.dto';
import { IRevenueRepository } from './interface/revenue.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { User } from 'src/user/entities/user.entity';
import { Revenue } from './entities/revenue.entity';
import { RevenueListDto } from './dto/revenue-list.dto';

@Injectable()
export class RevenueService {
  private readonly limitDefault = 5;
  private url = `${this.appConfig.getBaseUrl()}/revenue`;

  constructor(
    @Inject('IRevenueRepository')
    private revenueRepository: IRevenueRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(
    user: User,
    createRevenueDto: CreateRevenueDto,
  ): Promise<Revenue> {
    return this.revenueRepository.create(user, createRevenueDto);
  }

  async findAll(userList: RevenueListDto): Promise<paginationData<Revenue>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [revenues, total] = await this.revenueRepository.findAll(
      offset,
      userList.limit,
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
  ): Promise<Revenue> {
    return this.revenueRepository.update(revenueId, updateRevenueDto);
  }

  async remove(revenueId: string): Promise<Revenue> {
    return this.revenueRepository.remove(revenueId);
  }

  async delete(revenueId: string): Promise<boolean> {
    return this.revenueRepository.delete(revenueId);
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

    const revenues = await this.revenueRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );

    if (!revenues || !Array.isArray(revenues) || revenues.length === 0) {
      return {
        value: 0,
      };
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

  async confirmNewMonthRevenues(user: User): Promise<void> {
    const month = getPreviousMonth();
    const revenues = await this.revenueRepository.findByMonth(user.id, month);

    revenues.forEach(async (revenue: Revenue) => {
      await this.revenueRepository.create(user, {
        name: revenue.name,
        value: revenue.value,
        repeat: true,
      });
    });
  }

  async getAllByPreviousMonth(user: User): Promise<Revenue[] | []> {
    const month = getPreviousMonth();
    return await this.revenueRepository.findByMonth(user.id, month);
  }

  async exist(): Promise<boolean> {
    return this.revenueRepository.exist();
  }

  async getLatest(
    user: User,
    limit = this.limitDefault,
  ): Promise<Revenue[] | []> {
    return this.revenueRepository.getLatest(user.id, limit);
  }
}
