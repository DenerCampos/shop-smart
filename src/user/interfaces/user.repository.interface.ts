import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(newUser: CreateUserDto): Promise<User>;
  findAll(page: number, limit: number): Promise<[User[], number]>;
  find(id: string): Promise<User | null>;
  update(user: User, updateUser: UpdateUserDto): Promise<User>;
  remove(id: string): Promise<User>;
  delete(id: string): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
  saveToken(id: string, token: string): Promise<User>;
  countAll(): Promise<number>;
  exist(email: string, user: User): Promise<boolean>;
  saveRefreshToken(id: string, token: string): Promise<User>;
  findByRefreshToken(token: string): Promise<User | null>;
}
