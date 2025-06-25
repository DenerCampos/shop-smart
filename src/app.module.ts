import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from './config/typeorm.config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CouponReaderModule } from './coupon-reader/couponReader.module';
import { ExpenseModule } from './expense/expense.module';
import { PaymentModule } from './payment/payment.module';
import { RevenueModule } from './revenue/revenue.module';
import { GroupModule } from './group/group.module';
import { StoreModule } from './store/store.module';
import { CoinModule } from './coin/coin.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    UserModule,
    AuthModule,
    CouponReaderModule,
    ExpenseModule,
    PaymentModule,
    RevenueModule,
    GroupModule,
    StoreModule,
    CoinModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
