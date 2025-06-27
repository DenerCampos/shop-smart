export class ExpenseByGroupModel {
  name: string;
  value: number;

  constructor(data: Partial<ExpenseByGroupModel>) {
    this.name = data.name;
    this.value = data.value;
  }
}
