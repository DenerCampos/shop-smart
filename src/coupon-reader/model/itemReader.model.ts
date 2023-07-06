export class ItemReaderModel {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  total: number;
  group: {
    name: string;
  };
  purchaseDate: Date;

  constructor(data: Partial<ItemReaderModel>) {
    this.code = data.code;
    this.name = data.name;
    this.quantity = data.quantity;
    this.unit = data.unit;
    this.value = data.value;
    this.total = data.total;
    this.group = {
      name: 'Alimentação',
    };
    this.purchaseDate = new Date();
  }
}
