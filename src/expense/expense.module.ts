import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { UserModule } from 'src/user/user.module';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './repositories/expense.repository';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { StoreService } from 'src/store/store.service';
import { GroupService } from 'src/group/group.service';
import { PaymentService } from 'src/payment/payment.service';
import { Item } from './entities/item.entity';
import { StoreModule } from 'src/store/store.module';
import { PaymentModule } from 'src/payment/payment.module';
import { GroupModule } from 'src/group/group.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    StoreModule,
    PaymentModule,
    GroupModule,
    TypeOrmModule.forFeature([Expense, Item]),
  ],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    {
      provide: 'IExpenseRepository',
      useClass: ExpenseRepository,
    },
    {
      provide: 'IItemRepository',
      useClass: ExpenseRepository,
    },
  ],
  exports: [ExpenseService, 'IExpenseRepository', 'IItemRepository'],
})
export class ExpenseModule {}
