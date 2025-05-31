import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppConfig } from 'src/common/app-config/app.config';
import { CommonModule } from 'src/common/common.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueModule } from 'src/revenue/revenue.module';
import { CoinModule } from 'src/coin/coin.module';
import { RevenueService } from 'src/revenue/revenue.service';
import { CoinService } from 'src/coin/coin.service';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => ExpenseModule), //usado para corrigir dependencia circular. tentar mudar depois TODO
    forwardRef(() => CoinModule),
    forwardRef(() => RevenueModule),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: UserRepository,
      useFactory: (dataSource: DataSource) => {
        return new UserRepository(dataSource.getRepository(User));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: UserService,
      useFactory: (
        gateway: UserRepository,
        appConfig: AppConfig,
        expenseService: ExpenseService,
        revenueService: RevenueService,
        coinService: CoinService,
      ) => {
        return new UserService(
          gateway,
          appConfig,
          expenseService,
          revenueService,
          coinService,
        );
      },
      inject: [
        UserRepository,
        AppConfig,
        ExpenseService,
        RevenueService,
        CoinService,
      ],
    },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
