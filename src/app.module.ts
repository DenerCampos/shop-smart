import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
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
import { ChoreModule } from './chore/chore.module';
import { RecipeModule } from './recipe/recipe.module';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from './common/logger/logger.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 120,
      },
    ]),
    LoggerModule,
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
    ShoppingListModule,
    AlexaModule,
    ChoreModule,
    RecipeModule,
  ],
  controllers: [],
  providers: [
    RequestLoggingMiddleware,
    ThrottlerGuard,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useExisting: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Express 5: wildcard nomeado (ver migration guide Nest 11)
    consumer.apply(RequestLoggingMiddleware).forRoutes('{*splat}');
  }
}
