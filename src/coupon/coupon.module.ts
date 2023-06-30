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

@Module({
  imports: [],
  controllers: [CouponController],
  providers: [
    {
      provide: CouponRepository,
      useFactory: (dataSource: DataSource) => {
        return new CouponRepository(
          dataSource,
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
      useFactory: (gateway: CouponRepository) => {
        return new CouponService(gateway);
      },
      inject: [CouponRepository],
    },
  ],
})
export class CouponModule {}
