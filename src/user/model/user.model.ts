import { Exclude } from 'class-transformer';

export class UserModel {
  id: string;

  name: string;

  email: string;

  @Exclude()
  password: string;

  @Exclude()
  token: string;

  constructor(data: Partial<UserModel>) {
    this.id = data?.id;
    this.name = data?.name;
    this.email = data?.email;
    this.password = data?.password;
    this.token = data?.token;
  }
}
