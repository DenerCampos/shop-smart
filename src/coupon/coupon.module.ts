import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { getDataSourceToken } from '@nestjs/typeorm';

@Module({
  imports: [],
  controllers: [CouponController],
  providers: [
    {
      provide: CouponRepository,
      useFactory: (dataSource: DataSource) => {
        return new CouponRepository(dataSource.getRepository(Coupon));
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
