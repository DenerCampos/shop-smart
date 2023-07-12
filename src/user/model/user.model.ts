export class UserModel {
  id: string | number;
  name: string;
  email: string;

  constructor(data: Partial<UserModel>) {
    this.id = data?.id;
    this.name = data?.name;
    this.email = data?.email;
  }
}
