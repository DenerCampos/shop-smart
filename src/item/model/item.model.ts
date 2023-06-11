export class ItemModel {
  id: string | number;
  name: string;

  constructor(data: Partial<ItemModel>) {
    Object.assign(this, data);
  }
}
