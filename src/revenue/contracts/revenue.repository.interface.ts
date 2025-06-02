import { CreateRevenueDto } from '../dto/createRevenue.dto';
import { UpdateRevenueDto } from '../dto/updateRevenue.dto';
import { RevenueModel } from '../model/revenue.model';

export interface IRevenueRepository {
  create(
    userId: string,
    createRevenueDto: CreateRevenueDto,
  ): Promise<RevenueModel>;
  findAll(): Promise<RevenueModel[] | []>;
  find(id: string): Promise<RevenueModel | null>;
  update(id: string, updateRevenue: UpdateRevenueDto): Promise<RevenueModel>;
  remove(id: string): Promise<RevenueModel>;
  delete(id: string): Promise<boolean>;
  findByPeriodAndRepeat(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<RevenueModel[] | []>;
}
