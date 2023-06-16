import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { CouponReaderService } from './couponReader.service';

@Module({
  imports: [],
  controllers: [CouponReaderController],
  providers: [
    {
      provide: CouponReaderService,
      useFactory: () => {
        return new CouponReaderService();
      },
    },
  ],
})
export class CouponReaderModule {}
