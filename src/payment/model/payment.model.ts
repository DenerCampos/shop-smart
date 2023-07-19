export class PaymentModel {
  id: string | number;

  name: string;

  constructor(data: Partial<PaymentModel>) {
    this.id = data?.id;
    this.name = data?.name;
  }
}
