import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { CoinModule } from 'src/coin/coin.module';
import { GroupModule } from 'src/group/group.module';
import { PaymentModule } from 'src/payment/payment.module';
import { StoreModule } from 'src/store/store.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { Item } from 'src/expense/entities/item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from 'src/expense/entities/expense.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';

@Module({
  imports: [
    CommonModule,
    UserModule,
    ExpenseModule,
    CoinModule,
    GroupModule,
    PaymentModule,
    StoreModule,
    RevenueModule,
    TypeOrmModule.forFeature([Item, Expense, Revenue]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: 'IReportsRepository',
      useClass: ReportsRepository,
    },
  ],
  exports: [ReportsService, 'IReportsRepository'],
})
export class ReportsModule {}
