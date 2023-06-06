export class StoreModel {
  id: string | number;
  name: string;

  constructor(data: Partial<StoreModel>) {
    Object.assign(this, data);
  }
}
