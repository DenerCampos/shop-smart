import { StoreModel } from 'src/store/model/store.model';
import { ItemModel } from './item.model';

export class CouponModel {
  id: string | number;
  number: string;
  url: string;
  store?: StoreModel;
  items?: ItemModel[];

  constructor(data: Partial<CouponModel>) {
    const { store, items, ...coupon } = data;

    this.id = coupon.id;
    this.number = coupon.number;
    this.url = coupon.url;

    if (store) {
      this.store = new StoreModel({
        id: store.id,
        name: store.name,
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
            purchaseDate: item.purchaseDate,
            group: item.group,
            couponId: this.id,
          }),
      );
    }
  }
}
