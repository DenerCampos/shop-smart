import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from './config/typeorm.config';
import { StoreModule } from './store/store.module';
import { GroupModule } from './group/group.module';
import { CouponModule } from './coupon/coupon.module';
import { CouponReaderModule } from './coupon-reader/group.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    StoreModule,
    GroupModule,
    CouponModule,
    CouponReaderModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
