import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { CoinModule } from 'src/coin/coin.module';
import { GoogleDriveModule } from 'src/google-drive/google-drive.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    ExpenseModule,
    RevenueModule,
    CoinModule,
    GoogleDriveModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
