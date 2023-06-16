export class ItemReaderModel {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: string;
  total: string;
  date: Date;

  constructor(data: Partial<ItemReaderModel>) {
    Object.assign(this, data);
  }
}
