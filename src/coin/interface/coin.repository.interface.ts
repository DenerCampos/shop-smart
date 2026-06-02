import { CreateCoinDto } from '../dto/create-coin.dto';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';
import { UpdateCoinDto } from '../dto/update-coin.dto';
import { Coin } from '../entities/coin.entity';
import { User } from 'src/user/entities/user.entity';
import { EntityManager } from 'typeorm';
import { CoinTransaction } from '../entities/coinTransaction.entity';
import { TransactionType } from '../types/coinType';

export type CoinStatementTotals = {
  totalEarned: number;
  totalSpent: number;
};

export type CoinStatementRow = {
  id: string;
  amount: number;
  transactionType: TransactionType;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  userId: string;
  userName: string;
};

export interface ICoinRepository {
  create(
    user: User,
    createCoinDto: CreateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin>;
  findAll(
    page: number,
    limit: number,
    userId: string,
  ): Promise<[Coin[], number]>;
  find(id: string): Promise<Coin | null>;
  findWithUser(id: string): Promise<Coin | null>;
  findByUserId(userId: string): Promise<Coin | null>;
  update(
    coin: Coin,
    updateCoinDto: UpdateCoinDto,
    manager?: EntityManager,
  ): Promise<Coin>;
  remove(id: string): Promise<Coin>;
  delete(id: string): Promise<boolean>;
  createTransaction(
    user: User,
    createCoinTransactionDto: CreateCoinTransactionDto,
    manager?: EntityManager,
  ): Promise<CoinTransaction>;
  findStatementPage(
    userIds: string[],
    startDate: string,
    endDate: string,
    offset: number,
    limit: number,
  ): Promise<[CoinStatementRow[], number]>;
  getStatementTotals(
    userIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<CoinStatementTotals>;
  countAll(): Promise<number>;
}
