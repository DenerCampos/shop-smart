import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from '../common/event-emitter/event-emitter.provider';
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
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { CoinStatementQueryDto } from './dto/coin-statement-query.dto';
import {
  CoinStatementResponseDto,
  CoinStatementTotalsDto,
} from './dto/coin-statement-response.dto';

@Injectable()
export class CoinService {
  private readonly url = `${this.appConfig.getBaseUrl()}/coin`;
  private readonly addCoinsTypes = {
    coupon: 5,
    revenue: 10,
  };
  private readonly removeCoinsTypes = {
    imagem: 50,
    theme: 500,
    color: 10,
  };

  constructor(
    @Inject('ICoinRepository')
    private readonly coinRepository: ICoinRepository,
    private readonly appConfig: AppConfig,
    private readonly pagination: Pagination,
    private readonly queryRunnerFactory: QueryRunnerFactory,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
    private readonly familyMemberResolver: FamilyMemberResolverService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on(
      'coin.remove',
      async (user: User, type: coinType, metadata?: Record<string, any>) => {
        try {
          await this.removeCoins(user, { type });
          this.eventEmitter.emit('coin.success');
        } catch (error) {
          console.error('Error removing coins:', error);
          this.eventEmitter.emit('coin.error', error);
        }
      },
    );

    this.eventEmitter.on(
      'coin.add',
      async (user: User, type: coinType, metadata?: Record<string, any>) => {
        try {
          await this.addCoins(user, { type });
          this.eventEmitter.emit('coin.success');
        } catch (error) {
          console.error('Error adding coins:', error);
          this.eventEmitter.emit('coin.error', error);
        }
      },
    );
  }

  async create(
    user: User,
    createCoinDto: CreateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin> {
    return this.coinRepository.create(user, createCoinDto, manager);
  }

  async findAll(
    userList: CoinListDto,
    userId: string,
  ): Promise<paginationData<Coin>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [users, total] = await this.coinRepository.findAll(
      offset,
      userList.limit,
      userId,
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

  async findAndValidateOwnership(
    coinId: string,
    userId: string,
  ): Promise<Coin> {
    const coin = await this.coinRepository.findWithUser(coinId);

    if (!coin) {
      throw new NotExistException();
    }

    if (coin.user.id !== userId) {
      throw new ForbiddenException();
    }

    return coin;
  }

  async update(
    coinId: string,
    updateCoinDto: UpdateCoinDto,
    existingCoin?: Coin,
  ): Promise<Coin> {
    const coin = existingCoin ?? (await this.coinRepository.find(coinId));

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

  async addCoins(user: User, addCoinDto: { type: coinType }): Promise<Coin> {
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

  async addEarnedCoinsByAmount(
    user: User,
    coins: number,
    description: string,
  ): Promise<Coin> {
    const n = Math.floor(Number(coins));

    if (!Number.isFinite(n) || n <= 0) {
      const existing = await this.coinRepository.findByUserId(user.id);
      if (existing) {
        return existing;
      }

      return await this.coinRepository.create(user, {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });
    }

    const createCoinDto = await this.getCreateCoinDto(user.id, n);
    const beforeCoin = await this.getUserCoins(user.id);
    const createCoinTransactionDto: CreateCoinTransactionDto = {
      amount: n,
      transactionType: TransactionType.EARN,
      description,
      balanceBefore: beforeCoin,
      balanceAfter: Number(beforeCoin) + n,
    };

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

  async getStatement(
    user: User,
    query: CoinStatementQueryDto,
  ): Promise<CoinStatementResponseDto> {
    const userIds = await this.resolveUserIds(user, query.userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);
    const startDate = query.startDate!;
    const endDate = query.endDate!;

    const [rows, total] = await this.coinRepository.findStatementPage(
      userIds,
      startDate,
      endDate,
      offset,
      limit,
    );

    const totalsRaw = await this.coinRepository.getStatementTotals(
      userIds,
      startDate,
      endDate,
    );

    const paginated = this.pagination.paginateData(
      rows,
      page,
      limit,
      total,
      `${this.url}/statement`,
    );

    const totals: CoinStatementTotalsDto = {
      totalEarned: totalsRaw.totalEarned,
      totalSpent: totalsRaw.totalSpent,
    };

    return {
      totals,
      data: paginated.data,
      meta: paginated.meta,
      links: paginated.links,
    };
  }

  private async resolveUserIds(
    currentUser: User,
    userId?: string,
  ): Promise<string[]> {
    let userIds: string[];

    if (!userId) {
      userIds = await this.familyMemberResolver.getAcceptedMemberUserIdsIfAdmin(
        currentUser.id,
      );
    } else if (userId === 'all') {
      userIds = await this.familyMemberResolver.getAcceptedMemberUserIds(
        currentUser.id,
      );
    } else {
      const familyMemberIds =
        await this.familyMemberResolver.getAcceptedMemberUserIds(
          currentUser.id,
        );

      if (!familyMemberIds.includes(userId)) {
        throw new ForbiddenException(
          'Você não tem permissão para ver os dados deste usuário.',
        );
      }

      userIds = [userId];
    }

    if (userIds.length === 0) {
      return [currentUser.id];
    }

    return userIds;
  }
}
