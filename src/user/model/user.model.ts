export class UserModel {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;

  constructor(data: Partial<UserModel>) {
    this.id = data?.id;
    this.name = data?.name;
    this.email = data?.email;
    this.password = data?.password;
    this.token = data?.token;
  }

  // TODO: fazer uma função em cada model para retornar apenas os dados que podem ser retornados
}
