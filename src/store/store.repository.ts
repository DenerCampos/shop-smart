import { Injectable } from '@nestjs/common';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';
import { IStoreRepository } from './contracts/store.repository.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable() //transforma em um provider no nest
export class StoreRepository implements IStoreRepository {
  constructor(private storeEntity: Repository<Store>) {}
  async create(createStoreDto: CreateStoreDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async findAll(): Promise<any> {
    return this.storeEntity.find();
  }
  async find(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async remove(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
