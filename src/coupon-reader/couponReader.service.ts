import { Injectable } from '@nestjs/common';
import { CouponReaderModel } from './model/couponReader.model';
import { findSimilarString } from 'src/common/utils/similarString.util';
import { StoreService } from 'src/store/store.service';
import { GroupService } from 'src/group/group.service';
import { PaymentService } from 'src/payment/payment.service';
import { ExpenseService } from 'src/expense/expense.service';

@Injectable()
export class CouponReaderService {
  constructor(
    private readonly storeService: StoreService,
    private readonly groupService: GroupService,
    private readonly paymentService: PaymentService,
    private readonly expenseService: ExpenseService,
  ) {}

  async read(url: string): Promise<CouponReaderModel> {
    const couponReader = new CouponReaderModel(url);
    await couponReader.readUrl();

    const storesNames = await this.storeService.getAllNames();

    couponReader.store.name = couponReader.name;
    const similarityName = findSimilarString(couponReader.name, storesNames);

    if (similarityName) {
      couponReader.store.name = similarityName.match;
      couponReader.name = similarityName.match;
    }

    const paymentName = await this.expenseService.getMostUsedPaymentName();
    couponReader.payment.name = paymentName;

    for (const item of couponReader.items) {
      const itemName = await this.expenseService.getGroupNameByItemName(
        item.name,
      );

      item.group.name = itemName;
    }

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
