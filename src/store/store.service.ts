import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { StoreModel } from './model/store.model';
import { IStoreRepository } from './contracts/store.repository.interface';

@Injectable()
export class StoreService {
  constructor(private storeRepository: IStoreRepository) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreModel> {
    return this.storeRepository.create(createStoreDto);
  }

  async findAll(): Promise<StoreModel[] | []> {
    return this.storeRepository.findAll();
  }

  async find(storeId: string): Promise<StoreModel | null> {
    return this.storeRepository.find(storeId);
  }

  async update(
    storeId: string,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    return this.storeRepository.update(storeId, updateStoreDto);
  }

  async delete(storeId: string): Promise<boolean> {
    return this.storeRepository.delete(storeId);
  }
}
