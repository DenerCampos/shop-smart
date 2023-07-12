import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CouponReaderService } from './couponReader.service';
import { CouponReaderModel } from './model/couponReader.model';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/coupon-reader')
export class CouponReaderController {
  constructor(private readonly groupService: CouponReaderService) {}

  @UseGuards(AuthGuard)
  @Get(':url')
  read(@Param('url') url: string): Promise<CouponReaderModel> {
    return this.groupService.read(url);
  }
}
