import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { UserModule } from 'src/user/user.module';
import { CouponReaderService } from './couponReader.service';
import { CommonModule } from 'src/common/common.module';
import { StoreModule } from 'src/store/store.module';
import { TextRecognitionModule } from 'src/text-recognition/textRecognition.module';

@Module({
  imports: [CommonModule, UserModule, StoreModule, TextRecognitionModule],
  controllers: [CouponReaderController],
  providers: [CouponReaderService],
  exports: [CouponReaderService],
})
export class CouponReaderModule {}
