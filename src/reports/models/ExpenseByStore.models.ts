export class ExpenseByStoreModel {
  name: string;
  value: number;

  constructor(data: Partial<ExpenseByStoreModel>) {
    this.name = data.name;
    this.value = data.value;
  }
}
