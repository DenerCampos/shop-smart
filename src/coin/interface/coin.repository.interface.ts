import { CreateCoinDto } from '../dto/create-coin.dto';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';
import { UpdateCoinDto } from '../dto/update-coin.dto';
import { Coin } from '../entities/coin.entity';
import { User } from 'src/user/entities/user.entity';

export interface ICoinRepository {
  create(user: User, createCoinDto: CreateCoinDto): Promise<Coin>;
  findAll(page: number, limit: number): Promise<[Coin[], number]>;
  find(id: string): Promise<Coin | null>;
  findByUserId(userId: string): Promise<Coin | null>;
  update(id: string, updateCoin: UpdateCoinDto): Promise<Coin>;
  remove(id: string): Promise<Coin>;
  delete(id: string): Promise<boolean>;
  updateCoinsAndTransaction(
    user: User,
    createCoinDto: CreateCoinDto,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<Coin>;
  countAll(): Promise<number>;
}
