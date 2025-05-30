export class CoinModel {
  id: string | number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;

  constructor(data: Partial<CoinModel>) {
    this.id = data.id;
    this.balance = data.balance;
    this.totalEarned = data.totalEarned;
    this.totalSpent = data.totalSpent;
    this.createdAt = data.createdAt;
  }
}
