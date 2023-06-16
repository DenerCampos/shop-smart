import { Controller, Get, Param } from '@nestjs/common';
import { CouponReaderService } from './couponReader.service';
import { CouponReaderModel } from './model/couponReader.model';

@Controller('/coupon-reader')
export class CouponReaderController {
  constructor(private readonly groupService: CouponReaderService) {}

  @Get(':url')
  read(@Param('url') url: string): Promise<CouponReaderModel> {
    return this.groupService.read(url);
  }
}
