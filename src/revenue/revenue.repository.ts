import { Injectable } from '@nestjs/common';
import { IRevenueRepository } from './contracts/revenue.repository.interface';
import { Brackets, Equal, ILike, Not, Repository } from 'typeorm';
import { Revenue } from './entities/revenue.entity';
import { RevenueModel } from './model/revenue.model';
import { CreateRevenueDto } from './dto/createRevenue.dto';
import { UpdateRevenueDto } from './dto/updateRevenue.dto';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class RevenueRepository implements IRevenueRepository {
  constructor(private revenueEntity: Repository<Revenue>) {}

  async create(
    userId: string,
    createRevenueDto: CreateRevenueDto,
  ): Promise<RevenueModel> {
    const newRevenue = this.revenueEntity.create({
      ...createRevenueDto,
      user: { id: userId }, // Associar ao usuário
    });
    const savedRevenue = await this.revenueEntity.save(newRevenue);

    return new RevenueModel(savedRevenue);
  }

  async findAll(): Promise<RevenueModel[] | []> {
    const revenues = await this.revenueEntity.find();

    if (revenues) {
      return revenues.map((revenue) => new RevenueModel(revenue));
    }

    return [];
  }

  async find(id: string): Promise<RevenueModel | null> {
    const revenue = await this.revenueEntity.findOneBy({ id });

    if (revenue) {
      return new RevenueModel(revenue);
    }

    return null;
  }

  async update(
    id: string,
    updateRevenueDto: UpdateRevenueDto,
  ): Promise<RevenueModel> {
    const updateRevenue = await this.revenueEntity.findOneBy({ id });

    if (!updateRevenue) {
      throw new UpdateException();
    }

    const existRevenue = await this.revenueEntity.findOne({
      where: {
        name: ILike(`%${updateRevenueDto.name}%`),
        id: Not(Equal(updateRevenue.id)),
      },
    });

    if (existRevenue) {
      throw new AlreadyExistsException();
    }

    const store = await this.revenueEntity.save({
      ...updateRevenue,
      ...updateRevenueDto,
    });

    return new RevenueModel(store);
  }

  async remove(id: string): Promise<RevenueModel> {
    const revenue = await this.revenueEntity.findOneBy({ id });

    if (revenue) {
      throw new RemoveException();
    }

    await this.revenueEntity.remove(revenue);
    return new RevenueModel(revenue);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.revenueEntity.softDelete({ id });

    return result.affected === 1;
  }

  async findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<RevenueModel[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('DATE(revenue.createdAt) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('revenue.createdAt', 'ASC');

    const revenues = await query.getMany();

    return revenues.length > 0
      ? revenues.map((revenue) => new RevenueModel(revenue))
      : [];
  }

  async findByMonth(
    userId: string,
    month: number,
  ): Promise<RevenueModel[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('revenue.repeat = true')
      .andWhere('EXTRACT(MONTH FROM revenue.createdAt) = :month', { month })
      .orderBy('revenue.createdAt', 'ASC');

    const revenues = await query.getMany();

    return revenues.length > 0
      ? revenues.map((revenue) => new RevenueModel(revenue))
      : [];
  }

  async exist(): Promise<boolean> {
    const hasData = await this.revenueEntity
      .createQueryBuilder('revenue')
      .limit(1)
      .getOne();

    return hasData !== null;
  }
}
