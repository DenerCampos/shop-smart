import { StoreModel } from 'src/store/model/store.model';
import { ItemModel } from './item.model';
import { PaymentModel } from 'src/payment/model/payment.model';
import { UserModel } from 'src/user/model/user.model';

export class CouponModel {
  id: string | number;

  number: string;

  url: string;

  date: Date;

  store?: StoreModel;

  items?: ItemModel[];

  payment?: PaymentModel;

  user?: UserModel;

  constructor(data: Partial<CouponModel>) {
    const { store, items, payment, user, ...coupon } = data;

    this.id = coupon.id;
    this.number = coupon.number;
    this.url = coupon.url;
    this.date = coupon.date;

    if (user) {
      this.user = new UserModel({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    if (store) {
      this.store = new StoreModel({
        id: store.id,
        name: store.name,
      });
    }

    if (payment) {
      this.payment = new PaymentModel({
        id: payment.id,
        name: payment.name,
      });
    }

    if (items) {
      this.items = items?.map(
        (item) =>
          new ItemModel({
            id: item.id,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            value: item.value,
            group: item.group,
            couponId: this.id,
          }),
      );
    }
  }
}
