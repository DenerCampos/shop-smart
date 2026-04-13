import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { ICoinRepository } from '../interface/coin.repository.interface';
import { Coin } from '../entities/coin.entity';
import { CoinTransaction } from '../entities/coinTransaction.entity';
import { CreateCoinDto } from '../dto/create-coin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UpdateCoinDto } from '../dto/update-coin.dto';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';

@Injectable()
export class CoinRepository implements ICoinRepository {
  constructor(
    private queryRunner: QueryRunnerFactory,
    @InjectRepository(Coin)
    private coinEntity: Repository<Coin>,
    @InjectRepository(CoinTransaction)
    private coinTransactionEntity: Repository<CoinTransaction>,
  ) {}

  async create(
    user: User,
    createCoinDto: CreateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin> {
    const repository = manager ? manager.getRepository(Coin) : this.coinEntity;

    const existinCoin = await repository.findOne({
      where: {
        user: { id: user.id },
      },
    });

    if (existinCoin) {
      return existinCoin;
    }

    // Se não existe, cria novo
    const coin = repository.create({ ...createCoinDto, user });
    return repository.save(coin);
  }

  async findAll(
    page: number,
    limit: number,
    userId: string,
  ): Promise<[Coin[], number]> {
    const queryBuilder = this.coinEntity
      .createQueryBuilder('coin')
      .innerJoin('coin.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('coin.deletedAt IS NULL');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Coin | null> {
    return await this.coinEntity.findOneBy({ id });
  }

  async findWithUser(id: string): Promise<Coin | null> {
    return await this.coinEntity.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<Coin | null> {
    return await this.coinEntity.findOne({
      where: {
        user: { id: userId },
      },
    });
  }

  async remove(id: string): Promise<Coin> {
    const coin = await this.coinEntity.findOneBy({ id });

    if (coin) {
      throw new RemoveException();
    }

    await this.coinEntity.remove(coin);
    return coin;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.coinEntity.softDelete({ id });

    return result.affected === 1;
  }

  async update(
    coin: Coin,
    updateCoinDto: UpdateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin> {
    const repository = manager ? manager.getRepository(Coin) : this.coinEntity;

    return await repository.save({
      ...coin,
      ...updateCoinDto,
    });
  }

  async createTransaction(
    user: User,
    createCoinTransactionDto: CreateCoinTransactionDto,
    manager?: EntityManager,
  ): Promise<CoinTransaction> {
    const repository = manager
      ? manager.getRepository(CoinTransaction)
      : this.coinTransactionEntity;

    const coinTransaction = repository.create({
      ...createCoinTransactionDto,
      user: user, // Associar ao usuário
    });

    return await repository.save(coinTransaction);
  }

  async countAll(): Promise<number> {
    return await this.coinEntity.count({
      withDeleted: false,
    });
  }
}
