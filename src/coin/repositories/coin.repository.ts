import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import {
  ICoinRepository,
  CoinStatementRow,
  CoinStatementTotals,
} from '../interface/coin.repository.interface';
import { Coin } from '../entities/coin.entity';
import { CoinTransaction } from '../entities/coinTransaction.entity';
import { CreateCoinDto } from '../dto/create-coin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UpdateCoinDto } from '../dto/update-coin.dto';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';
import { TransactionType } from '../types/coinType';

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

  async findStatementPage(
    userIds: string[],
    startDate: string,
    endDate: string,
    offset: number,
    limit: number,
  ): Promise<[CoinStatementRow[], number]> {
    const baseQb = this.coinTransactionEntity
      .createQueryBuilder('tx')
      .innerJoin('tx.user', 'user')
      .where('tx.deletedAt IS NULL')
      .andWhere('user.id IN (:...userIds)', { userIds })
      .andWhere('tx.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    const total = await baseQb.getCount();

    const rows = await baseQb
      .select([
        'tx.id AS id',
        'tx.amount AS amount',
        'tx.transactionType AS transactionType',
        'tx.description AS description',
        'tx.balanceBefore AS balanceBefore',
        'tx.balanceAfter AS balanceAfter',
        'tx.createdAt AS createdAt',
        'user.id AS userId',
        'user.name AS userName',
      ])
      .orderBy('tx.createdAt', 'DESC')
      .addOrderBy('tx.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<CoinStatementRow>();

    return [
      rows.map((row) => ({
        ...row,
        amount: Number(row.amount),
        balanceBefore: Number(row.balanceBefore),
        balanceAfter: Number(row.balanceAfter),
      })),
      total,
    ];
  }

  async getStatementTotals(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<CoinStatementTotals> {
    const raw = await this.coinTransactionEntity
      .createQueryBuilder('tx')
      .innerJoin('tx.user', 'user')
      .select(
        `SUM(CASE WHEN tx.transactionType IN ('${TransactionType.EARN}', '${TransactionType.BONUS}', '${TransactionType.REFUND}') THEN tx.amount ELSE 0 END)`,
        'totalEarned',
      )
      .addSelect(
        `SUM(CASE WHEN tx.transactionType IN ('${TransactionType.SPEND}', '${TransactionType.PENALTY}') THEN tx.amount ELSE 0 END)`,
        'totalSpent',
      )
      .where('tx.deletedAt IS NULL')
      .andWhere('user.id IN (:...userIds)', { userIds })
      .andWhere('tx.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getRawOne<{ totalEarned: string | null; totalSpent: string | null }>();

    return {
      totalEarned: Number(raw?.totalEarned ?? 0),
      totalSpent: Number(raw?.totalSpent ?? 0),
    };
  }

  async countAll(): Promise<number> {
    return await this.coinEntity.count({
      withDeleted: false,
    });
  }
}
