import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { Store } from '../entities/store.entity';

export interface IStoreRepository {
  create(newStore: CreateStoreDto): Promise<Store>;
  findAll(): Promise<Store[] | []>;
  find(id: string): Promise<Store | null>;
  update(id: string, updateStore: UpdateStoreDto): Promise<Store>;
  remove(id: string): Promise<Store>;
  delete(id: string): Promise<boolean>;
  countAll(): Promise<number>;
}
