import { Group } from 'src/group/entities/group.entity';
import { Coupon } from '../entities/coupon.entity';

export class ItemModel {
  id: string | number;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseDate: Date;
  group: Group;
  coupon: Coupon;

  constructor(data: Partial<ItemModel>) {
    Object.assign(this, data);
  }
}
