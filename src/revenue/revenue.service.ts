import { Injectable } from '@nestjs/common';
import { IRevenueRepository } from './contracts/revenue.repository.interface';
import { CreateRevenueDto } from './dto/createRevenue.dto';
import { RevenueModel } from './model/revenue.model';
import { UpdateRevenueDto } from './dto/updateRevenue.dto';
import { UserModel } from 'src/user/model/user.model';
import {
  getCurrentMonth,
  getCurrentMonthDates,
  getPreviousMonth,
} from 'src/common/utils/dates';
import { GetValueRevenueCurrentDto } from './dto/getValueRevenueCurrent.dto';

@Injectable()
export class RevenueService {
  private readonly limitDefault = 5;

  constructor(private revenueRepository: IRevenueRepository) {}

  async create(
    user: UserModel,
    createRevenueDto: CreateRevenueDto,
  ): Promise<RevenueModel> {
    return this.revenueRepository.create(user.id, createRevenueDto);
  }

  async findAll(): Promise<RevenueModel[] | []> {
    return this.revenueRepository.findAll();
  }

  async find(revenueId: string): Promise<RevenueModel | null> {
    return this.revenueRepository.find(revenueId);
  }

  async update(
    revenueId: string,
    updateRevenueDto: UpdateRevenueDto,
  ): Promise<RevenueModel> {
    return this.revenueRepository.update(revenueId, updateRevenueDto);
  }

  async remove(revenueId: string): Promise<RevenueModel> {
    return this.revenueRepository.remove(revenueId);
  }

  async delete(revenueId: string): Promise<boolean> {
    return this.revenueRepository.delete(revenueId);
  }

  async getAllByCurrentMonth(user: UserModel): Promise<RevenueModel[] | []> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    return this.revenueRepository.findByPeriod(
      user.id,
      startDateString,
      endDateString,
    );
  }

  async getRevenueByCurrentMonth(
    user: UserModel,
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
    revenues.forEach((revenue: RevenueModel) => {
      const value = Number(revenue.value) || 0;
      total += value;
    });

    return {
      value: Number((Math.ceil(total * 100) / 100).toFixed(2)),
    };
  }

  async isUserNewMonth(user: UserModel): Promise<boolean> {
    const month = getCurrentMonth();
    const revenues = await this.revenueRepository.findByMonth(user.id, month);

    return revenues.length === 0;
  }

  async confirmNewMonthRevenues(user: UserModel): Promise<void> {
    const month = getPreviousMonth();
    const revenues = await this.revenueRepository.findByMonth(user.id, month);

    revenues.forEach(async (revenue: RevenueModel) => {
      await this.revenueRepository.create(user.id.toString(), {
        name: revenue.name,
        value: revenue.value,
        repeat: true,
      });
    });
  }

  async getAllByPreviousMonth(user: UserModel): Promise<RevenueModel[] | []> {
    const month = getPreviousMonth();
    return await this.revenueRepository.findByMonth(user.id, month);
  }

  async exist(): Promise<boolean> {
    return this.revenueRepository.exist();
  }

  async getLatest(
    user: UserModel,
    limit = this.limitDefault,
  ): Promise<RevenueModel[] | []> {
    return this.revenueRepository.getLatest(user.id, limit);
  }
}
