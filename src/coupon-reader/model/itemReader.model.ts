export class ItemReaderModel {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: string;
  total: string;

  constructor(data: Partial<ItemReaderModel>) {
    this.code = data.code;
    this.name = data.name;
    this.quantity = data.quantity;
    this.unit = data.unit;
    this.value = data.value;
    this.total = data.total;
  }
}
