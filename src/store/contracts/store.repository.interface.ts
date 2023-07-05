import { CreateStoreDto } from '../dto/createStore.dto';
import { UpdateStoreDto } from '../dto/updateStore.dto';
import { StoreModel } from '../model/store.model';

export interface IStoreRepository {
  create(newStore: CreateStoreDto): Promise<StoreModel>;
  findAll(): Promise<StoreModel[] | []>;
  find(id: string): Promise<StoreModel | null>;
  update(id: string, updateStore: UpdateStoreDto): Promise<StoreModel>;
  remove(id: string): Promise<StoreModel>;
  delete(id: string): Promise<boolean>;
}
