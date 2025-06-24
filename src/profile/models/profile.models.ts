import { User } from 'src/user/entities/user.entity';

export class ProfileModel {
  user: User;
  income: number;
  expenses: number;
  coins: number;
  isFirstAccess: boolean;
  newMonth: boolean;

  constructor(data: Partial<ProfileModel>) {
    this.user = data.user;
    this.income = data.income;
    this.expenses = data.expenses;
    this.coins = data.coins;
    this.isFirstAccess = data.isFirstAccess;
    this.newMonth = data.newMonth;
  }
}
