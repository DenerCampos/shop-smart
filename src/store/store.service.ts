import { Injectable } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  create(createStoreDto: CreateStoreDto) {
    return this.storeRepository.create(createStoreDto);
  }

  findAll() {
    return this.storeRepository.findAll();
  }

  find(id: string) {
    return this.storeRepository.find(id);
  }

  findOne(id: string) {
    return this.storeRepository.find(id);
  }

  update(id: string, updateStoreDto: UpdateStoreDto) {
    return this.storeRepository.update(id, updateStoreDto);
  }

  remove(id: string) {
    return this.storeRepository.remove(id);
  }
}
