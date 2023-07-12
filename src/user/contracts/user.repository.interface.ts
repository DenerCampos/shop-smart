import { CreateUserDto } from '../dto/createUser.dto';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { UserModel } from '../model/user.model';

export interface IUserRepository {
  create(newUser: CreateUserDto): Promise<UserModel>;
  findAll(): Promise<UserModel[] | []>;
  find(id: string): Promise<UserModel | null>;
  update(id: string, updateUser: UpdateUserDto): Promise<UserModel>;
  remove(id: string): Promise<UserModel>;
  delete(id: string): Promise<boolean>;
}
