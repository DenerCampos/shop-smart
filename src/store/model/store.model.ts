export class StoreModel {
  id: string | number;

  name: string;

  constructor(data: Partial<StoreModel>) {
    this.id = data?.id;
    this.name = data?.name;
  }
}
