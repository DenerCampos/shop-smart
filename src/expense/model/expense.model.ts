export class ExpenseModel {
  id: string | number;
  name: string;
  value: number;
  repeat: boolean;
  createdAt: Date;

  constructor(data: Partial<ExpenseModel>) {
    this.id = data.id;
    this.name = data.name;
    this.value = data.value;
    this.repeat = data.repeat;
    this.createdAt = data.createdAt;
  }
}
