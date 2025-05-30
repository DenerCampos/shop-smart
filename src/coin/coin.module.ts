import { Module } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';
import { CoinRepository } from './coin.repository';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Coin } from './entities/coin.entity';
import { UserModule } from 'src/user/user.module';
import { CoinTransaction } from './entities/coinTransaction.entity';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [UserModule],
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
      useFactory: (repository: CoinRepository, userService: UserService) => {
        return new CoinService(repository, userService);
      },
      inject: [CoinRepository, UserService],
    },
  ],
})
export class CoinModule {}
