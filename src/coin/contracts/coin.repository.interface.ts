import { CreateCoinDto } from '../dto/createCoin.dto';
import { CreateCoinTransactionDto } from '../dto/createCoinTransaction.dto';
import { UpdateCoinDto } from '../dto/updateCoin.dto';
import { CoinModel } from '../model/coin.model';

export interface ICoinRepository {
  create(userId: string, createCoinDto: CreateCoinDto): Promise<CoinModel>;
  findAll(): Promise<CoinModel[] | []>;
  find(id: string): Promise<CoinModel | null>;
  findByUserId(userId: string): Promise<CoinModel | null>;
  update(id: string, updateCoin: UpdateCoinDto): Promise<CoinModel>;
  remove(id: string): Promise<CoinModel>;
  delete(id: string): Promise<boolean>;
  updateCoinsAndTransaction(
    userId: string,
    createCoinDto: CreateCoinDto,
    createCoinTransactionDto: CreateCoinTransactionDto,
  ): Promise<CoinModel>;
}
