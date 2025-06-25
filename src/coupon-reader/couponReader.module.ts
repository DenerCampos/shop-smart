import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { UserModule } from 'src/user/user.module';
import { CouponReaderService } from './couponReader.service';
import { CommonModule } from 'src/common/common.module';
import { StoreModule } from 'src/store/store.module';
import { PaymentModule } from 'src/payment/payment.module';
import { GroupModule } from 'src/group/group.module';
import { ExpenseModule } from 'src/expense/expense.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    StoreModule,
    PaymentModule,
    GroupModule,
    ExpenseModule,
  ],
  controllers: [CouponReaderController],
  providers: [CouponReaderService],
  exports: [CouponReaderService],
})
export class CouponReaderModule {}
