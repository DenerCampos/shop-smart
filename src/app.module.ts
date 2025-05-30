import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from './config/typeorm.config';
import { StoreModule } from './store/store.module';
import { GroupModule } from './group/group.module';
import { CouponModule } from './coupon/coupon.module';
import { CouponReaderModule } from './coupon-reader/couponReader.module';
import { PaymentModule } from './payment/payment.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RevenueModule } from './revenue/revenue.module';
import { CoinModule } from './coin/coin.module';
import { ExpenseModule } from './expense/expense.module';

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
    UserModule,
    AuthModule,
    RevenueModule,
    CoinModule,
    ExpenseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
