import { Exclude } from 'class-transformer';

export class UserModel {
  id: string;

  name: string;

  email: string;

  family: string;

  income: number;

  expenses: number;

  coins: number;

  coatOfArms: string;

  @Exclude()
  password: string;

  @Exclude()
  token: string;

  constructor(data: Partial<UserModel>) {
    this.id = data?.id;
    this.name = data?.name;
    this.email = data?.email;
    this.family = data?.family;
    this.income = data?.income;
    this.expenses = data?.expenses;
    this.coins = data?.coins;
    this.coatOfArms = data?.coatOfArms;
    this.password = data?.password;
    this.token = data?.token;
  }
}
