import { Group } from 'src/group/entities/group.entity';
import { Coupon } from '../entities/coupon.entity';

export class CreateItemDto {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseDate: Date;
  group: Group;
  coupon: Coupon;
}
