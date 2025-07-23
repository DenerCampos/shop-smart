import { User } from 'src/user/entities/user.entity';
import { CreateRevenueDto } from '../dto/create-revenue.dto';
import { UpdateRevenueDto } from '../dto/update-revenue.dto';
import { Revenue } from '../entities/revenue.entity';
import { EntityManager } from 'typeorm';

export interface IRevenueRepository {
  create(user: User, createRevenueDto: CreateRevenueDto): Promise<Revenue>;
  findAll(page: number, limit: number): Promise<[Revenue[], number]>;
  find(id: string): Promise<Revenue | null>;
  update(
    revenue: Revenue,
    updateRevenue: UpdateRevenueDto,
    manager?: EntityManager,
  ): Promise<Revenue>;
  remove(id: string): Promise<Revenue>;
  delete(id: string): Promise<boolean>;
  findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Revenue[] | []>;
  findByMonth(userId: string, month: number): Promise<Revenue[] | []>;
  exist(): Promise<boolean>;
  getLatest(userId: string, limit: number): Promise<Revenue[] | []>;
  countAll(): Promise<number>;
  findRecurringByMonthAndDay(
    userId: string,
    month: number,
    day: number,
  ): Promise<Revenue[] | []>;
}
