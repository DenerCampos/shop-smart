export class ExpensesIncomeComparisonModel {
  month: string;
  totalExpenses: number;
  totalRevenues: number;

  constructor(data: Partial<ExpensesIncomeComparisonModel>) {
    this.month = data.month;
    this.totalExpenses = data.totalExpenses;
    this.totalRevenues = data.totalRevenues;
  }
}
