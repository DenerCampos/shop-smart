import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { CouponReaderService } from './couponReader.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
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
