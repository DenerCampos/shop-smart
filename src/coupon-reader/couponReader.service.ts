import { Injectable } from '@nestjs/common';
import { CouponReaderModel } from './model/couponReader.model';

@Injectable()
export class CouponReaderService {
  constructor() {}

  async read(url: string): Promise<CouponReaderModel> {
    const couponReader = new CouponReaderModel(url);
    await couponReader.readUrl();

    // for (const item of couponReader.items) {
    //   item.group.name = await this.findGroupByIdOrName(item.code, item.name);
    // }

    return couponReader;
  }

  // private async findGroupByIdOrName(
  //   itemId: string,
  //   itemName: string,
  // ): Promise<string> {
  //   let name = this.groupDefault;

  //   const group = await this.groupRepository.findByItemIdOrName(
  //     itemId,
  //     itemName,
  //   );

  //   if (group) {
  //     name = group.name;
  //   }

  //   return name;
  // }
}
