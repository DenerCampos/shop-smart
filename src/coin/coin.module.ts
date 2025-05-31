import { forwardRef, Module } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';
import { CoinRepository } from './coin.repository';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Coin } from './entities/coin.entity';
import { CoinTransaction } from './entities/coinTransaction.entity';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [CoinController],
  providers: [
    {
      provide: CoinRepository,
      useFactory: (dataSource: DataSource) => {
        return new CoinRepository(
          new QueryRunnerFactory(dataSource),
          dataSource.getRepository(Coin),
          dataSource.getRepository(CoinTransaction),
        );
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: CoinService,
      useFactory: (repository: CoinRepository) => {
        return new CoinService(repository);
      },
      inject: [CoinRepository],
    },
  ],
  exports: [CoinService, CoinRepository],
})
export class CoinModule {}
