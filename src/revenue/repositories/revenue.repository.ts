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
    manager?: EntityManager,
  ): Promise<Revenue> {
    const repository = manager
      ? manager.getRepository(Revenue)
      : this.revenueEntity;

    const newRevenue = repository.create({
      ...createRevenueDto,
      user: user,
    });

    return repository.save(newRevenue);
  }

  async findAll(
    userIds: string[],
    page: number,
    limit: number,
    search?: string,
    isRecurring?: boolean,
  ): Promise<[Revenue[], number]> {
    const queryBuilder = this.revenueEntity
      .createQueryBuilder('revenue')
      .withDeleted();

    queryBuilder
      .leftJoin('revenue.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.profileImage']);

    queryBuilder.where('revenue.user IN (:...userIds)', { userIds });
    queryBuilder.andWhere('revenue.deletedAt IS NULL');

    if (search) {
      queryBuilder.andWhere('LOWER(revenue.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (isRecurring !== undefined) {
      queryBuilder.andWhere('revenue.repeat = :isRecurring', { isRecurring });
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

  async getLatest(userIds: string[], limit: number): Promise<Revenue[] | []> {
    if (!userIds || userIds.length === 0) return [];

    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoin('revenue.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.profileImage'])
      .where('revenue.userId IN (:...userIds)', { userIds })
      .andWhere('revenue.deletedAt IS NULL')
      .take(limit)
      .orderBy('revenue.createdAt', 'DESC');

    return await query.getMany();
  }

  async countAll(): Promise<number> {
    return await this.revenueEntity.count({
      withDeleted: false,
    });
  }

  async countByUser(userIds: string[]): Promise<number> {
    if (!userIds || userIds.length === 0) return 0;

    return await this.revenueEntity
      .createQueryBuilder('revenue')
      .where('revenue.userId IN (:...userIds)', { userIds })
      .andWhere('revenue.deletedAt IS NULL')
      .getCount();
  }

  async findRecurringByMonthAndDay(
    userId: string,
    month: number,
    day: number,
  ): Promise<Revenue[] | []> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('revenue.repeat = true')
      .andWhere(
        `(
          (EXTRACT(YEAR FROM revenue.date) < :currentYear)
          OR 
          (
            EXTRACT(YEAR FROM revenue.date) = :currentYear 
            AND EXTRACT(MONTH FROM revenue.date) < :currentMonth
          )
          OR
          (
            EXTRACT(YEAR FROM revenue.date) = :currentYear 
            AND EXTRACT(MONTH FROM revenue.date) = :month 
            AND EXTRACT(DAY FROM revenue.date) <= :day
          )
        )`,
        { currentYear, currentMonth, month, day },
      )
      .orderBy('revenue.date', 'ASC');

    return await query.getMany();
  }
}
