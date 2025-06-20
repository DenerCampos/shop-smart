import { Inject, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { IStoreRepository } from './interface/store.repository.interface';
import { Store } from './entities/store.entity';

@Injectable()
export class StoreService {
  constructor(
    @Inject('IStoreRepository')
    private storeRepository: IStoreRepository,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    return this.storeRepository.create(createStoreDto);
  }

  async findAll(): Promise<Store[] | []> {
    return this.storeRepository.findAll();
  }

  async find(storeId: string): Promise<Store | null> {
    return this.storeRepository.find(storeId);
  }

  async update(
    storeId: string,
    updateStoreDto: UpdateStoreDto,
  ): Promise<Store> {
    return this.storeRepository.update(storeId, updateStoreDto);
  }

  async delete(storeId: string): Promise<boolean> {
    return this.storeRepository.delete(storeId);
  }
}
