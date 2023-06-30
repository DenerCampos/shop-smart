import { Injectable } from '@nestjs/common';
import { CouponReaderModel } from './model/couponReader.model';

@Injectable()
export class CouponReaderService {
  async read(url: string): Promise<CouponReaderModel> {
    const couponReader = new CouponReaderModel(url);
    await couponReader.readUrl();

    return couponReader;
  }
}
