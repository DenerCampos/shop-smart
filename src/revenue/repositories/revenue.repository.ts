import { Injectable } from '@nestjs/common';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
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

  async findAll(page: number, limit: number): Promise<[Revenue[], number]> {
    const queryBuilder = this.revenueEntity.createQueryBuilder('revenue');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Revenue | null> {
    return await this.revenueEntity.findOneBy({ id });
  }

  async update(
    id: string,
    updateRevenueDto: UpdateRevenueDto,
  ): Promise<Revenue> {
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

    return await this.revenueEntity.save({
      ...updateRevenue,
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
      .andWhere('DATE(revenue.createdAt) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('revenue.createdAt', 'ASC');

    return await query.getMany();
  }

  async findByMonth(userId: string, month: number): Promise<Revenue[] | []> {
    const query = this.revenueEntity
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.user', 'user')
      .where('revenue.user = :userId', { userId })
      .andWhere('revenue.deletedAt IS NULL')
      .andWhere('revenue.repeat = true')
      .andWhere('EXTRACT(MONTH FROM revenue.createdAt) = :month', { month })
      .orderBy('revenue.createdAt', 'ASC');

    return await query.getMany();
  }

  async exist(): Promise<boolean> {
    const hasData = await this.revenueEntity
      .createQueryBuilder('revenue')
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
}
