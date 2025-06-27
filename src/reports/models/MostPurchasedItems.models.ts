export class MostPurchasedItemsModel {
  name: string;
  quantity: number;
  value: number;

  constructor(data: Partial<MostPurchasedItemsModel>) {
    this.name = data.name;
    this.quantity = data.quantity;
    this.value = data.value;
  }
}
