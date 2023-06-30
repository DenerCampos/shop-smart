import { CreateStoreDto } from '../dto/createStore.dto';
import { UpdateStoreDto } from '../dto/updateStore.dto';
import { StoreModel } from '../model/store.model';

export interface IStoreRepository {
  create(newStore: CreateStoreDto): Promise<StoreModel>;
  findAll(): Promise<StoreModel[] | []>;
  find(id: number): Promise<StoreModel | null>;
  update(id: number, updateStore: UpdateStoreDto): Promise<StoreModel>;
  remove(id: number): Promise<StoreModel>;
  delete(id: number): Promise<boolean>;
}
