import { Inject, Injectable } from '@nestjs/common';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import {
  coinTransactionDescription,
  coinType,
  TransactionType,
} from './types/coinType';
import { AddCoinDto } from './dto/add-coin.dto';
import { RemoveCoinDto } from './dto/remove-coin.dto';
import { NotExistException } from 'src/exception/notExistException';
import { InsufficientResourceException } from 'src/exception/insufficientResourceException';
import { ICoinRepository } from './interface/coin.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { User } from 'src/user/entities/user.entity';
import { Coin } from './entities/coin.entity';
import { CoinListDto } from './dto/coin-list.dto';
import { CreateCoinTransactionDto } from './dto/create-coin-transaction.dto';
import { EntityManager } from 'typeorm';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';

@Injectable()
export class CoinService {
  private url = `${this.appConfig.getBaseUrl()}/coin`;
  private addCoinsTypes = {
    coupon: 5,
    group: 2,
    payment: 2,
    store: 2,
    resource: 2,
  };
  private removeCoinsTypes = {
    imagem: 50,
    theme: 200,
    color: 10,
  };

  constructor(
    @Inject('ICoinRepository')
    private coinRepository: ICoinRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private queryRunnerFactory: QueryRunnerFactory,
  ) {}

  async create(
    user: User,
    createCoinDto: CreateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin> {
    return this.coinRepository.create(user, createCoinDto, manager);
  }

  async findAll(userList: CoinListDto): Promise<paginationData<Coin>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [users, total] = await this.coinRepository.findAll(
      offset,
      userList.limit,
    );

    const paginateData = this.pagination.paginateData<Coin>(
      users,
      userList.page,
      userList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(coinId: string): Promise<Coin | null> {
    return this.coinRepository.find(coinId);
  }

  async update(coinId: string, updateCoinDto: UpdateCoinDto): Promise<Coin> {
    const coin = await this.coinRepository.find(coinId);

    if (!coin) {
      throw new NotExistException();
    }

    return this.coinRepository.update(coin, updateCoinDto);
  }

  async remove(coinId: string): Promise<Coin> {
    return this.coinRepository.remove(coinId);
  }

  async delete(coinId: string): Promise<boolean> {
    return this.coinRepository.delete(coinId);
  }

  private getValueCoinsByType(type: coinType): number {
    const types = {
      ...this.addCoinsTypes,
      ...this.removeCoinsTypes,
    };

    return types[type] || 0;
  }

  async getUserCoins(userId: string): Promise<number> {
    return (await this.coinRepository.findByUserId(userId))?.balance || 0;
  }

  private async getCreateCoinDto(
    userId: string,
    coins: number,
  ): Promise<CreateCoinDto> {
    const createCoinDto = {
      balance: coins, //moedas
      totalEarned: coins, //total ganho
      totalSpent: 0, //total gasto
    };
    const userCoin = await this.coinRepository.findByUserId(userId);

    if (userCoin) {
      createCoinDto.balance = Number(userCoin.balance) + Number(coins);
      createCoinDto.totalEarned = Number(userCoin.totalEarned) + Number(coins);
      createCoinDto.totalSpent = Number(userCoin.totalSpent);
    }

    return createCoinDto;
  }

  private async getCreateCoinTransactionDto(
    userId: string,
    coins: number,
    type: coinType,
  ): Promise<CreateCoinTransactionDto> {
    const beforeCoin = await this.getUserCoins(userId);

    return {
      amount: coins,
      transactionType: TransactionType.EARN,
      description: coinTransactionDescription[type.toUpperCase()],
      balanceBefore: beforeCoin,
      balanceAfter: Number(beforeCoin) + Number(coins),
    };
  }

  async addCoins(user: User, addCoinDto: AddCoinDto): Promise<Coin> {
    const coins = this.getValueCoinsByType(addCoinDto.type);
    const createCoinDto = await this.getCreateCoinDto(user.id, coins);
    const createCoinTransactionDto = await this.getCreateCoinTransactionDto(
      user.id,
      coins,
      addCoinDto.type,
    );

    return this.updateCoinsAndTransaction(
      user,
      createCoinDto,
      createCoinTransactionDto,
    );
  }

  private async getOrCreateCoin(
    user: User,
    createCoinDto: CreateCoinDto,
  ): Promise<Coin> {
    return (
      (await this.coinRepository.findByUserId(user.id)) ||
      (await this.coinRepository.create(user, createCoinDto))
    );
  }

  private async updateCoinsAndTransaction(
    user: User,
    createCoinDto: CreateCoinDto,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<Coin> {
    try {
      const userCoin = await this.getOrCreateCoin(user, createCoinDto);

      await this.queryRunnerFactory.startTransaction();

      const coin = await this.coinRepository.update(
        userCoin,
        createCoinDto,
        this.queryRunnerFactory.manager,
      );

      await this.coinRepository.createTransaction(
        user,
        createCoinTransactionDto,
        this.queryRunnerFactory.manager,
      );

      await this.queryRunnerFactory.commitTransaction();

      return coin;
    } catch (error) {
      await this.queryRunnerFactory.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  private async getRemoveCoinDto(
    userId: string,
    coins: number,
  ): Promise<CreateCoinDto> {
    const userCoin = await this.coinRepository.findByUserId(userId);

    if (!userCoin) {
      throw new NotExistException({
        description: 'O usuario nao possui moedas',
      });
    }

    return {
      balance: Number(userCoin.balance) - Number(coins),
      totalEarned: Number(userCoin.totalEarned),
      totalSpent: Number(userCoin.totalSpent) + Number(coins),
    };
  }

  private async getRemoveCoinTransactionDto(
    userId: string,
    coins: number,
    type: coinType,
  ): Promise<CreateCoinTransactionDto> {
    const beforeCoin = await this.getUserCoins(userId);

    return {
      amount: coins,
      transactionType: TransactionType.SPEND,
      description: coinTransactionDescription[type.toUpperCase()],
      balanceBefore: beforeCoin,
      balanceAfter: Number(beforeCoin) - Number(coins),
    };
  }

  async removeCoins(user: User, removeCoinDto: RemoveCoinDto) {
    const coins = this.getValueCoinsByType(removeCoinDto.type);

    const userCoin = await this.coinRepository.findByUserId(user.id);

    if (!userCoin) {
      throw new NotExistException({
        description: 'O usuario nao possui moedas',
      });
    }

    if (userCoin.balance < coins) {
      throw new InsufficientResourceException({
        description: 'O usuario nao possui moedas suficientes',
      });
    }

    const subtractCoinDto = await this.getRemoveCoinDto(user.id, coins);
    const subtractCoinTransactionDto = await this.getRemoveCoinTransactionDto(
      user.id,
      coins,
      removeCoinDto.type,
    );

    return this.updateCoinsAndTransaction(
      user,
      subtractCoinDto,
      subtractCoinTransactionDto,
    );
  }

  async getCoinsByUser(user: User): Promise<number> {
    const coin = await this.coinRepository.findByUserId(user.id);

    return coin?.balance || 0;
  }
}
