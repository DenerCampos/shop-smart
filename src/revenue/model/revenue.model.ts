export class RevenueModel {
  id: string | number;
  name: string;
  value: number;
  repeat: boolean;
  createdAt: Date;

  constructor(data: Partial<RevenueModel>) {
    this.id = data.id;
    this.name = data.name;
    this.value = data.value;
    this.repeat = data.repeat;
    this.createdAt = data.createdAt;
  }
}
