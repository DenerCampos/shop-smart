import { Injectable } from '@nestjs/common';
import { Store } from './entities/store.entity';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { IStoreRepository } from './contracts/store.repository.interface';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { StoreModel } from './model/store.model';
import { UpdateException } from 'src/Exception/updateException';
import { AlreadyExistsException } from 'src/Exception/alreadyExistsException copy';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(private storeEntity: Repository<Store>) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreModel> {
    const store = await this.storeEntity.findOne({
      where: {
        name: ILike(`%${createStoreDto.name}%`),
      },
    });

    if (store) {
      return new StoreModel(store);
    } else {
      const newStore = this.storeEntity.create(createStoreDto);

      const savedStore = await this.storeEntity.save(newStore);
      return new StoreModel(savedStore);
    }
  }

  async findAll(): Promise<StoreModel[]> {
    const stores = await this.storeEntity.find();

    return stores.map(({ id, name }) => new StoreModel({ id, name }));
  }

  async find(id: number): Promise<StoreModel> {
    const store = await this.storeEntity.findOneBy({ id });

    return new StoreModel(store);
  }

  async update(
    id: number,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    const updateStore = await this.storeEntity.findOneBy({ id });

    if (!updateStore) {
      throw new UpdateException();
    }

    const existStore = await this.storeEntity.findOne({
      where: {
        name: ILike(`%${updateStoreDto.name}%`),
        id: Not(Equal(updateStore.id)),
      },
    });

    if (existStore) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new AlreadyExistsException();
    }

    const store = await this.storeEntity.save({
      ...updateStore,
      ...updateStoreDto,
    });

    return new StoreModel(store);
  }

  async remove(id: number): Promise<StoreModel> {
    const store = await this.storeEntity.findOneBy({ id });

    return this.storeEntity.remove(store);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.storeEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
