import { Injectable } from '@nestjs/common';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';
import { IStoreRepository } from './contracts/store.repository.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(private storeEntity: Repository<Store>) {}
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const store = this.storeEntity.create(createStoreDto);

    return this.storeEntity.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeEntity.find();
  }

  async find(id: number): Promise<Store> {
    return this.storeEntity.findOneBy({ id });
  }

  async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeEntity.findOneBy({ id });

    return this.storeEntity.save({ ...store, ...updateStoreDto });
  }

  async remove(id: number): Promise<Store> {
    const store = await this.storeEntity.findOneBy({ id });

    return this.storeEntity.remove(store);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.storeEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
