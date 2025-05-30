import { Injectable } from '@nestjs/common';
import { IRevenueRepository } from './contracts/revenue.repository.interface';
import { CreateRevenueDto } from './dto/createRevenue.dto';
import { RevenueModel } from './model/revenue.model';
import { UpdateRevenueDto } from './dto/updateRevenue.dto';
import { UserModel } from 'src/user/model/user.model';
import { getCurrentMonthDates } from 'src/common/utils/dates';
import { GetValueRevenueCurrentDto } from './dto/getValueRevenueCurrent.dto';

@Injectable()
export class RevenueService {
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

    return this.revenueRepository.findByPeriodAndRepeatRaw(
      user.id,
      startDateString,
      endDateString,
    );
  }

  async getRevenueByCurrentMonth(
    user: UserModel,
  ): Promise<GetValueRevenueCurrentDto> {
    const { startDateString, endDateString } = getCurrentMonthDates();

    const revenues = await this.revenueRepository.findByPeriodAndRepeatRaw(
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
}
