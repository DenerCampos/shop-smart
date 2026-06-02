import { Expose, Type } from 'class-transformer';
import { CoinTransactionItemDto } from './coin-transaction-item.dto';

export class CoinStatementTotalsDto {
  @Expose()
  totalEarned: number;

  @Expose()
  totalSpent: number;
}

export class CoinStatementResponseDto {
  @Expose()
  @Type(() => CoinStatementTotalsDto)
  totals: CoinStatementTotalsDto;

  @Expose()
  @Type(() => CoinTransactionItemDto)
  data: CoinTransactionItemDto[];

  @Expose()
  meta: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  @Expose()
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
  };
}
