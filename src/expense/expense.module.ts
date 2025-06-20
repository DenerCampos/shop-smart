import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { UserModule } from 'src/user/user.module';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './repositories/expense.repository';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';

@Module({
  imports: [CommonModule, UserModule, TypeOrmModule.forFeature([Expense])],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    {
      provide: 'IExpenseRepository',
      useClass: ExpenseRepository,
    },
  ],
  exports: [ExpenseService, 'IExpenseRepository'],
})
export class ExpenseModule {}
