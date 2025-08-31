import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { IRevenueRepository } from '../interface/revenue.repository.interface';
import { Revenue } from '../entities/revenue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { CreateRevenueDto } from '../dto/create-revenue.dto';
import { UpdateRevenueDto } from '../dto/update-revenue.dto';

@Injectable()
export class RevenueRepository implements IRevenueRepository {
  constructor(
    @InjectRepository(Revenue)
    private revenueEntity: Repository<Revenue>,
  ) {}

  async create(
    user: User,
    createRevenueDto: CreateRevenueDto,
  ): Promise<Revenue> {
    const newRevenue = this.revenueEntity.create({
      ...createRevenueDto,
      user: user,
    });

    return await this.revenueEntity.save(newRevenue);
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Revenue[], number]> {
    const queryBuilder = this.revenueEntity.createQueryBuilder('revenue');

    if (search) {
      queryBuilder.where('LOWER(revenue.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    queryBuilder.orderBy('revenue.createdAt', 'DESC');

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Revenue | null> {
    return await this.revenueEntity.findOneBy({ id });
  }

  async update(
    revenue: Revenue,
    updateRevenueDto: UpdateRevenueDto,
    manager?: EntityManager,
  ): Promise<Revenue> {
    const repository = manager
      ? manager.getRepository(Revenue)
      : this.revenueEntity;

    return await repository.save({
      ...revenue,
      ...updateRevenueDto,
    });
  }

  async remove(id: string): Promise<Revenue> {
    const revenue = await this.revenueEntity.findOneBy({ id });

    if (revenue) {
      throw new RemoveException();
    }

    await this.revenueEntity.remove(revenue);
    return revenue;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.revenueEntity.softDelete({ id });

    return result.affected === 1;
  }

  async findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Revenue[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('DATE(revenue.date) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('revenue.date', 'ASC');

    return await query.getMany();
  }

  async findByMonth(userId: string, month: number): Promise<Revenue[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('revenue.repeat = true')
      .andWhere('EXTRACT(MONTH FROM revenue.date) = :month', { month })
      .orderBy('revenue.date', 'ASC');

    return await query.getMany();
  }

  async exist(userId: string): Promise<boolean> {
    const hasData = await this.revenueEntity
      .createQueryBuilder('revenue')
      .where('revenue.user = :userId', { userId })
      .limit(1)
      .getOne();

    return hasData !== null;
  }

  async getLatest(userId: string, limit: number): Promise<Revenue[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .limit(limit)
      .orderBy('revenue.createdAt', 'DESC');

    return await query.getMany();
  }

  async countAll(): Promise<number> {
    return await this.revenueEntity.count({
      withDeleted: false,
    });
  }

  async findRecurringByMonthAndDay(
    userId: string,
    month: number,
    day: number,
  ): Promise<Revenue[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('revenue.repeat = true')
      .andWhere('EXTRACT(MONTH FROM revenue.date) <= :month', { month })
      .andWhere('EXTRACT(DAY FROM revenue.date) <= :day', { day })
      .orderBy('revenue.date', 'ASC');

    return await query.getMany();
  }
}
