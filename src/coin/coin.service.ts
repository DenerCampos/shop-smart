import { Injectable } from '@nestjs/common';
import { ICoinRepository } from './contracts/coin.repository.interface';
import { CreateCoinDto } from './dto/createCoin.dto';
import { CoinModel } from './model/coin.model';
import { UpdateCoinDto } from './dto/updateCoin.dto';
import {
  coinTransactionDescription,
  coinType,
  TransactionType,
} from './types/coinType';
import { CreateCoinTransactionDto } from './dto/createCoinTransaction.dto';
import { UserModel } from 'src/user/model/user.model';
import { AddCoinDto } from './dto/addCoin.dto';
import { RemoveCoinDto } from './dto/removeCoin.dto';
import { NotExistException } from 'src/exception/notExistException';
import { InsufficientResourceException } from 'src/exception/insufficientResourceException';

@Injectable()
export class CoinService {
  constructor(private coinRepository: ICoinRepository) {}

  async create(
    user: UserModel,
    createCoinDto: CreateCoinDto,
  ): Promise<CoinModel> {
    return this.coinRepository.create(user.id, createCoinDto);
  }

  async findAll(): Promise<CoinModel[] | []> {
    return this.coinRepository.findAll();
  }

  async find(coinId: string): Promise<CoinModel | null> {
    return this.coinRepository.find(coinId);
  }

  async update(
    coinId: string,
    updateCoinDto: UpdateCoinDto,
  ): Promise<CoinModel> {
    return this.coinRepository.update(coinId, updateCoinDto);
  }

  async remove(coinId: string): Promise<CoinModel> {
    return this.coinRepository.remove(coinId);
  }

  async delete(coinId: string): Promise<boolean> {
    return this.coinRepository.delete(coinId);
  }

  private getValueCoinsByType(type: coinType): number {
    const addTypes = {
      coupon: 5,
      group: 2,
      payment: 2,
      store: 2,
      resource: 2,
    };

    const removeTypes = {
      imagem: 50,
      theme: 200,
      color: 10,
    };

    const types = {
      ...addTypes,
      ...removeTypes,
    };

    return types[type] || 0;
  }

  async getUserCoins(userId: string): Promise<number> {
    return (await this.coinRepository.findByUserId(userId))?.balance || 0;
  }

  async getCreateCoinDto(
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

  async getCreateCoinTransactionDto(
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

  async addCoins(user: UserModel, addCoinDto: AddCoinDto): Promise<CoinModel> {
    const coins = this.getValueCoinsByType(addCoinDto.type);
    const createCoinDto = await this.getCreateCoinDto(user.id, coins);
    const createCoinTransactionDto = await this.getCreateCoinTransactionDto(
      user.id,
      coins,
      addCoinDto.type,
    );

    return this.coinRepository.updateCoinsAndTransaction(
      user.id,
      createCoinDto,
      createCoinTransactionDto,
    );
  }

  async getRemoveCoinDto(
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

  async getRemoveCoinTransactionDto(
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

  async removeCoins(user: UserModel, removeCoinDto: RemoveCoinDto) {
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

    return this.coinRepository.updateCoinsAndTransaction(
      user.id,
      subtractCoinDto,
      subtractCoinTransactionDto,
    );
  }

  async getCoinsByUser(user: UserModel): Promise<number> {
    const coin = await this.coinRepository.findByUserId(user.id);

    return coin?.balance || 0;
  }
}
