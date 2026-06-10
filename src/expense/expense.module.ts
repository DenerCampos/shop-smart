import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { UserModule } from 'src/user/user.module';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './repositories/expense.repository';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { Item } from './entities/item.entity';
import { StoreModule } from 'src/store/store.module';
import { PaymentModule } from 'src/payment/payment.module';
import { GroupModule } from 'src/group/group.module';
import { CoinModule } from 'src/coin/coin.module';
import { AudioRecognitionModule } from 'src/audio-recognition/audioRecognition.module';
import { ImageRecognitionModule } from 'src/image-recognition/imageRecognition.module';

import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    StoreModule,
    PaymentModule,
    GroupModule,
    CoinModule,
    AudioRecognitionModule,
    ImageRecognitionModule,
    FileStorageModule,
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
