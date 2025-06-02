import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Store } from 'src/store/entities/store.entity';
import { Group } from 'src/group/entities/group.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { Pagination } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { CoinModule } from 'src/coin/coin.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { RevenueService } from 'src/revenue/revenue.service';
import { ExpenseService } from 'src/expense/expense.service';
import { CoinService } from 'src/coin/coin.service';

@Module({
  imports: [CommonModule, UserModule, CoinModule, ExpenseModule, RevenueModule],
  controllers: [CouponController],
  providers: [
    {
      provide: CouponRepository,
      useFactory: (dataSource: DataSource) => {
        return new CouponRepository(
          new QueryRunnerFactory(dataSource),
          dataSource.getRepository(Coupon),
          dataSource.getRepository(Item),
          dataSource.getRepository(Store),
          dataSource.getRepository(Group),
          dataSource.getRepository(Payment),
        );
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: CouponService,
      useFactory: (
        repository: CouponRepository,
        pagination: Pagination,
        appConfig: AppConfig,
        coinService: CoinService,
        expenseService: ExpenseService,
        revenueService: RevenueService,
      ) => {
        return new CouponService(
          repository,
          pagination,
          appConfig,
          coinService,
          expenseService,
          revenueService,
        );
      },
      inject: [
        CouponRepository,
        Pagination,
        AppConfig,
        CoinService,
        ExpenseService,
        RevenueService,
      ],
    },
  ],
})
export class CouponModule {}
