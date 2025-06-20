import { Injectable } from '@nestjs/common';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';
import { IStoreRepository } from '../interface/store.repository.interface';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(
    @InjectRepository(Store)
    private storeEntity: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const store = await this.storeEntity.findOne({
      where: {
        name: ILike(`%${createStoreDto.name}%`),
      },
    });

    if (store) {
      return store;
    } else {
      const newStore = this.storeEntity.create(createStoreDto);

      return await this.storeEntity.save(newStore);
    }
  }

  async countAll(): Promise<number> {
    return await this.storeEntity.count({
      withDeleted: false,
    });
  }

  async findAll(): Promise<Store[] | []> {
    return await this.storeEntity.find();
  }

  async find(id: string): Promise<Store | null> {
    return await this.storeEntity.findOneBy({ id });
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
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

    return await this.storeEntity.save({
      ...updateStore,
      ...updateStoreDto,
    });
  }

  async remove(id: string): Promise<Store> {
    const store = await this.storeEntity.findOneBy({ id });

    if (store) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.storeEntity.remove(store);
    return store;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.storeEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
