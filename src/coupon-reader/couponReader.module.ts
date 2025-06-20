import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { UserModule } from 'src/user/user.module';
import { CouponReaderService } from './couponReader.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule, UserModule],
  controllers: [CouponReaderController],
  providers: [CouponReaderService],
  exports: [CouponReaderService],
})
export class CouponReaderModule {}
