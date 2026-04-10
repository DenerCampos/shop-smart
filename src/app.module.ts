import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
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
import { ReportsModule } from './reports/reports.module';
import { ThemeModule } from './theme/theme.module';
import { ImageRecognitionModule } from './image-recognition/imageRecognition.module';
import { AudioRecognitionModule } from './audio-recognition/audioRecognition.module';
import { TextRecognitionModule } from './text-recognition/textRecognition.module';
import { FamilyGroupModule } from './family-group/family-group.module';
import { ShoppingListModule } from './shopping-list/shopping-list.module';
import { AlexaModule } from './alexa/alexa.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
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
    ReportsModule,
    ThemeModule,
    ImageRecognitionModule,
    AudioRecognitionModule,
    TextRecognitionModule,
    FamilyGroupModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 120,
    }),
    ShoppingListModule,
    AlexaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
