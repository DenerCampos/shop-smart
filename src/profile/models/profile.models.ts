import { User } from 'src/user/entities/user.entity';

export class ProfileModel {
  user: User;
  income: number;
  expenses: number;
  coins: number;
  isFirstAccess: boolean;
  hasRecurringRevenues: boolean;
  hasRecurringExpenses: boolean;

  constructor(data: Partial<ProfileModel>) {
    this.user = data.user;
    this.income = data.income ?? 0;
    this.expenses = data.expenses ?? 0;
    this.coins = data.coins ?? 0;
    this.isFirstAccess = data.isFirstAccess ?? false;
    this.hasRecurringRevenues = data.hasRecurringRevenues ?? false;
    this.hasRecurringExpenses = data.hasRecurringExpenses ?? false;
  }
}
