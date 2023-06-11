import { Store } from '../entities/store.entity';

export interface IStoreRepository {
  create(newStore: Store): Promise<Store>;
  findAll(): Promise<Store[]>;
  find(id: number): Promise<Store>;
  update(id: number, updateStore: Store): Promise<Store>;
  remove(id: number): Promise<Store>;
  delete(id: number): Promise<boolean>;
}
