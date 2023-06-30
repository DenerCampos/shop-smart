import { GroupModel } from 'src/group/model/group.model';

export class ItemModel {
  id: string | number;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseDate: Date;
  group: GroupModel;
  couponId?: string | number;

  constructor(data: Partial<ItemModel>) {
    const { group, ...item } = data;

    this.id = item.id;
    this.code = item.code;
    this.name = item.name;
    this.quantity = item.quantity;
    this.unit = item.unit;
    this.value = item.value;
    this.purchaseDate = item.purchaseDate;
    this.group = new GroupModel(group);
    this.couponId = item.couponId;
  }
}
