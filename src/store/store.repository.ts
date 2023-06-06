import { Injectable } from '@nestjs/common';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';

@Injectable() //transforma em um provider no nest
export class StoreRepository {
  constructor(private storeEntity: Repository<Store>) {}
  async getAll() {
    const teste = await this.storeEntity.find();
    return teste;
  }
}
