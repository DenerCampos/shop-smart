export class ExpenseByDateModel {
  value: number;
  date: Date;

  constructor(data: Partial<ExpenseByDateModel>) {
    this.value = data.value;
    this.date = data.date;
  }
}
