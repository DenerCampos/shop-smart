import { CreateCoinDto } from '../dto/create-coin.dto';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';
import { UpdateCoinDto } from '../dto/update-coin.dto';
import { Coin } from '../entities/coin.entity';
import { User } from 'src/user/entities/user.entity';
import { EntityManager } from 'typeorm';
import { CoinTransaction } from '../entities/coinTransaction.entity';

export interface ICoinRepository {
  create(
    user: User,
    createCoinDto: CreateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin>;
  findAll(page: number, limit: number): Promise<[Coin[], number]>;
  find(id: string): Promise<Coin | null>;
  findByUserId(userId: string): Promise<Coin | null>;
  update(coin: Coin, updateCoin: UpdateCoinDto): Promise<Coin>;
  remove(id: string): Promise<Coin>;
  delete(id: string): Promise<boolean>;
  updateTransaction(
    user: User,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<CoinTransaction>;
  countAll(): Promise<number>;
  updateCoins(user: User, updateCoinDto: UpdateCoinDto): Promise<Coin>;
}
