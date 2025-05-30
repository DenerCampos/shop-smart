import { Injectable } from '@nestjs/common';
import { ICoinRepository } from './contracts/coin.repository.interface';
import { Repository } from 'typeorm';
import { Coin } from './entities/coin.entity';
import { CoinModel } from './model/coin.model';
import { CreateCoinDto } from './dto/createCoin.dto';
import { UpdateCoinDto } from './dto/updateCoin.dto';
import { UpdateException } from 'src/exception/updateException';
import { RemoveException } from 'src/exception/removeException';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { CoinTransaction } from './entities/coinTransaction.entity';
import { CreateCoinTransactionDto } from './dto/createCoinTransaction.dto';

@Injectable()
export class CoinRepository implements ICoinRepository {
  constructor(
    private queryRunner: QueryRunnerFactory,
    private coinEntity: Repository<Coin>,
    private coinTransactionEntity: Repository<CoinTransaction>,
  ) {}

  async create(
    userId: string,
    createCoinDto: CreateCoinDto,
  ): Promise<CoinModel> {
    let userCoin = await this.coinEntity.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!userCoin) {
      userCoin = this.coinEntity.create(createCoinDto);
      await this.coinEntity.save(userCoin);
    }

    return new CoinModel(userCoin);
  }

  async findAll(): Promise<CoinModel[] | []> {
    const coins = await this.coinEntity.find();

    if (coins) {
      return coins.map((coin) => new CoinModel(coin));
    }

    return [];
  }

  async find(id: string): Promise<CoinModel | null> {
    const coin = await this.coinEntity.findOneBy({ id });

    if (coin) {
      return new CoinModel(coin);
    }

    return null;
  }

  async findByUserId(userId: string): Promise<CoinModel | null> {
    const coin = await this.coinEntity.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (coin) {
      return new CoinModel(coin);
    }

    return null;
  }

  async update(id: string, updateCoinDto: UpdateCoinDto): Promise<CoinModel> {
    const updateCoin = await this.coinEntity.findOneBy({ id });

    if (!updateCoin) {
      throw new UpdateException();
    }

    const store = await this.coinEntity.save({
      ...updateCoin,
      ...updateCoinDto,
    });

    return new CoinModel(store);
  }

  async remove(id: string): Promise<CoinModel> {
    const coin = await this.coinEntity.findOneBy({ id });

    if (coin) {
      throw new RemoveException();
    }

    await this.coinEntity.remove(coin);
    return new CoinModel(coin);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.coinEntity.softDelete({ id });

    return result.affected === 1;
  }

  async updateCoinsAndTransaction(
    userId: string,
    createCoinDto: CreateCoinDto,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<CoinModel> {
    try {
      await this.queryRunner.startTransaction();

      let userCoin = await this.coinEntity.findOne({
        where: {
          user: { id: userId },
        },
      });

      if (!userCoin) {
        userCoin = this.coinEntity.create({
          ...createCoinDto,
          user: { id: userId }, // Associar ao usuário
        });
      }

      userCoin = await this.coinEntity.save({
        ...userCoin,
        ...createCoinDto,
      });

      const coinTransaction = this.coinTransactionEntity.create({
        ...createCoinTransactionDto,
        user: { id: userId }, // Associar ao usuário
      });

      await this.coinTransactionEntity.save(coinTransaction);
      await this.coinEntity.save(userCoin);

      await this.queryRunner.commitTransaction();

      return new CoinModel(userCoin);
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw new Error(error.message);
    }
  }
}
