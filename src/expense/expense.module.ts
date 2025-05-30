import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './expense.repository';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [ExpenseController],
  providers: [
    {
      provide: ExpenseRepository,
      useFactory: (dataSource: DataSource) => {
        return new ExpenseRepository(dataSource.getRepository(Expense));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: ExpenseService,
      useFactory: (gateway: ExpenseRepository) => {
        return new ExpenseService(gateway);
      },
      inject: [ExpenseRepository],
    },
  ],
})
export class ExpenseModule {}
