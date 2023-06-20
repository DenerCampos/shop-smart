import { Store } from 'src/store/entities/store.entity';
import { Item } from '../entities/item.entity';

export class CreateCouponDto {
  number: string;
  store: Store;
  url?: string;
  items: Item[];
}
