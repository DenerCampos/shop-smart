import { Injectable } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreModel } from './model/store.model';

@Injectable()
export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreModel> {
    const { id, name } = await this.storeRepository.create(createStoreDto);
    return new StoreModel({ id, name });
  }

  async findAll(): Promise<StoreModel[]> {
    const stores = await this.storeRepository.findAll();
    return stores.map(({ id, name }) => new StoreModel({ id, name }));
  }

  async find(storeId: number): Promise<StoreModel> {
    const { id, name } = await this.storeRepository.find(storeId);
    return new StoreModel({ id, name });
  }

  async update(
    storeId: number,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    const { id, name } = await this.storeRepository.update(
      storeId,
      updateStoreDto,
    );
    return new StoreModel({ id, name });
  }

  async remove(storeId: number): Promise<StoreModel> {
    const { id, name } = await this.storeRepository.remove(storeId);
    return new StoreModel({ id, name });
  }
}
