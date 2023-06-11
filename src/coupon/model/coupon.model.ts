import { Store } from 'src/store/entities/store.entity';
import { Item } from '../entities/item.entity';

export class CouponModel {
  id: string | number;
  number: string;
  store: Store;
  items: Item[];

  constructor(data: Partial<CouponModel>) {
    Object.assign(this, data);
  }
}
