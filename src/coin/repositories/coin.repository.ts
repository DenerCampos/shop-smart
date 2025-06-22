import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
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

  async create(user: User, createCoinDto: CreateCoinDto): Promise<Coin> {
    let userCoin = await this.coinEntity.findOne({
      where: {
        user: { id: user.id },
      },
    });

    if (!userCoin) {
      userCoin = this.coinEntity.create({
        ...createCoinDto,
        user,
      });
    }

    await this.coinEntity.save(userCoin);

    return userCoin;
  }

  async findAll(page: number, limit: number): Promise<[Coin[], number]> {
    const queryBuilder = this.coinEntity.createQueryBuilder('coin');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Coin | null> {
    return await this.coinEntity.findOneBy({ id });
  }

  async findByUserId(userId: string): Promise<Coin | null> {
    return await this.coinEntity.findOne({
      where: {
        user: { id: userId },
      },
    });
  }

  async update(id: string, updateCoinDto: UpdateCoinDto): Promise<Coin> {
    const updateCoin = await this.coinEntity.findOneBy({ id });

    if (!updateCoin) {
      throw new UpdateException();
    }

    return await this.coinEntity.save({
      ...updateCoin,
      ...updateCoinDto,
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

  async updateCoinsAndTransaction(
    user: User,
    createCoinDto: CreateCoinDto,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<Coin> {
    try {
      await this.queryRunner.startTransaction();

      let userCoin = await this.coinEntity.findOne({
        where: {
          user: { id: user.id },
        },
      });

      if (!userCoin) {
        userCoin = this.coinEntity.create({
          ...createCoinDto,
          user, // Associar ao usuário
        });
      }

      userCoin = await this.coinEntity.save({
        ...userCoin,
        ...createCoinDto,
      });

      const coinTransaction = this.coinTransactionEntity.create({
        ...createCoinTransactionDto,
        user: user, // Associar ao usuário
      });

      await this.coinTransactionEntity.save(coinTransaction);
      await this.coinEntity.save(userCoin);

      await this.queryRunner.commitTransaction();

      return userCoin;
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async countAll(): Promise<number> {
    return await this.coinEntity.count({
      withDeleted: false,
    });
  }
}
