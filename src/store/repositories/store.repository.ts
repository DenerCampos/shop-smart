import { Injectable } from '@nestjs/common';
import { EntityManager, Equal, ILike, Not, Repository } from 'typeorm';
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

  async create(
    createStoreDto: CreateStoreDto,
    manager?: EntityManager,
  ): Promise<Store> {
    const repository = manager
      ? manager.getRepository(Store)
      : this.storeEntity;

    // Busca primeiro se existe
    const existingStore = await repository.findOne({
      where: {
        name: ILike(`%${createStoreDto.name}%`),
      },
    });

    // Se existe, retorna o existente
    if (existingStore) {
      return existingStore;
    }

    // Se não existe, cria novo
    const store = repository.create(createStoreDto);
    return repository.save(store);
  }

  async countAll(): Promise<number> {
    return await this.storeEntity.count({
      withDeleted: false,
    });
  }

  async findAll(page: number, limit: number): Promise<[Store[], number]> {
    const queryBuilder = this.storeEntity.createQueryBuilder('store');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Store | null> {
    return await this.storeEntity.findOneBy({ id });
  }

  async update(
    store: Store,
    updateStoreDto: UpdateStoreDto,
    manager?: EntityManager,
  ): Promise<Store> {
    const repository = manager
      ? manager.getRepository(Store)
      : this.storeEntity;

    return await repository.save({
      ...store,
      ...updateStoreDto,
    });
  }

  async exist(name: string, store: Store): Promise<boolean> {
    const existStore = await this.storeEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
        id: Not(Equal(store.id)),
      },
    });

    return existStore ? true : false;
  }

  async findByName(name: string): Promise<Store | null> {
    return await this.storeEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
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

  async getAllNames(max: number): Promise<string[]> {
    const stores = await this.storeEntity.find({
      select: ['name'],
      take: max,
    });

    return stores.map((store) => store.name);
  }
}
