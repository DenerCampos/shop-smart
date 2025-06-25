import { Module } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coin } from './entities/coin.entity';
import { CoinTransaction } from './entities/coinTransaction.entity';
import { UserModule } from 'src/user/user.module';
import { CommonModule } from 'src/common/common.module';
import { CoinRepository } from './repositories/coin.repository';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';

@Module({
  imports: [
    CommonModule,
    UserModule,
    TypeOrmModule.forFeature([Coin, CoinTransaction]),
  ],
  controllers: [CoinController],
  providers: [
    CoinService,
    QueryRunnerFactory,
    {
      provide: 'ICoinRepository',
      useClass: CoinRepository,
    },
    {
      provide: 'ICoinTransactionRepository',
      useClass: CoinRepository,
    },
  ],
  exports: [CoinService, 'ICoinRepository', 'ICoinTransactionRepository'],
})
export class CoinModule {}
