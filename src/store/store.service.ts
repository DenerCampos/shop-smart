import { Injectable } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { StoreModel } from './model/store.model';

@Injectable()
export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreModel> {
    return this.storeRepository.create(createStoreDto);
  }

  async findAll(): Promise<StoreModel[] | []> {
    return this.storeRepository.findAll();
  }

  async find(storeId: number): Promise<StoreModel | null> {
    return this.storeRepository.find(storeId);
  }

  async update(
    storeId: number,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    return this.storeRepository.update(storeId, updateStoreDto);
  }

  async delete(storeId: number): Promise<boolean> {
    return this.storeRepository.delete(storeId);
  }
}
