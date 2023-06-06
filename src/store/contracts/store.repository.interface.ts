import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';

export interface IStoreRepository {
  create(createStoreDto: CreateStoreDto): Promise<any>;
  findAll(): Promise<any>;
  find(id: string): Promise<any>;
  update(id: string, updateStoreDto: UpdateStoreDto): Promise<any>;
  remove(id: string): Promise<any>;
}
