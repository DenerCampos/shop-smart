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
import { UserService } from 'src/user/user.service';

@Module({
  imports: [CommonModule, UserModule],
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
        UserService: UserService,
      ) => {
        return new CouponService(
          repository,
          pagination,
          appConfig,
          UserService,
        );
      },
      inject: [CouponRepository, Pagination, AppConfig, UserService],
    },
  ],
})
export class CouponModule {}
