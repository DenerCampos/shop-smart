import { Injectable } from '@nestjs/common';
import { StoreRepository } from './store.repository';

@Injectable()
export class StoreService {
  constructor(private storeRepository: StoreRepository) {}
  async getTest() {
    return this.storeRepository.getAll();
  }
}
