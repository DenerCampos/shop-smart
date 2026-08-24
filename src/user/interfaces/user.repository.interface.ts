import { EntityManager } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(newUser: CreateUserDto): Promise<User>;
  find(id: string): Promise<User | null>;
  update(user: User, updateUser: UpdateUserDto): Promise<User>;
  remove(id: string): Promise<User>;
  delete(id: string, manager?: EntityManager): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  invalidateSession(id: string, manager?: EntityManager): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithDeleted(email: string): Promise<User | null>;
  searchByEmailPrefix(emailPrefix: string, limit: number): Promise<User[]>;
  saveToken(id: string, token: string): Promise<User>;
  clearAuthTokens(id: string): Promise<void>;
  countAll(): Promise<number>;
  exist(email: string, user: User): Promise<boolean>;
  saveRefreshToken(id: string, token: string): Promise<User>;
  findByRefreshToken(token: string): Promise<User | null>;
}
