import { EntityManager } from 'typeorm';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { Store } from '../entities/store.entity';

export interface IStoreRepository {
  create(
    createStoreDto: CreateStoreDto,
    manager?: EntityManager,
  ): Promise<Store>;
  findAll(page: number, limit: number): Promise<[Store[], number]>;
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
  findByName(name: string): Promise<Store | null>;
  getAllNames(max: number): Promise<string[]>;
}
