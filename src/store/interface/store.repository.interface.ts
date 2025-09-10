import { EntityManager } from 'typeorm';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { Store } from '../entities/store.entity';
import { User } from 'src/user/entities/user.entity';

export interface IStoreRepository {
  create(
    createStoreDto: CreateStoreDto,
    user: User,
    manager?: EntityManager,
  ): Promise<Store>;
  findAll(
    user: User,
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Store[], number]>;
  find(id: string): Promise<Store | null>;
  update(
    store: Store,
    updateStore: UpdateStoreDto,
    manager?: EntityManager,
  ): Promise<Store>;
  remove(id: string): Promise<Store>;
  delete(id: string): Promise<boolean>;
  countAll(): Promise<number>;
  exist(name: string, store: Store): Promise<boolean>;
  findByName(name: string, user: User): Promise<Store | null>;
  getAllNames(max: number): Promise<string[]>;
}
