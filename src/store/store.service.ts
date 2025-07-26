import { Inject, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { IStoreRepository } from './interface/store.repository.interface';
import { Store } from './entities/store.entity';
import { StoreListDto } from './dto/store-list.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { EntityManager } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';

@Injectable()
export class StoreService {
  private url = `${this.appConfig.getBaseUrl()}/store`;

  constructor(
    @Inject('IStoreRepository')
    private storeRepository: IStoreRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(
    createStoreDto: CreateStoreDto,
    manager?: EntityManager,
  ): Promise<Store> {
    return this.storeRepository.create(createStoreDto, manager);
  }

  async findAll(userList: StoreListDto): Promise<paginationData<Store>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [users, total] = await this.storeRepository.findAll(
      offset,
      userList.limit,
      userList.search,
    );

    const paginateData = this.pagination.paginateData<Store>(
      users,
      userList.page,
      userList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async getAllNames(max = 200): Promise<string[]> {
    return this.storeRepository.getAllNames(max);
  }

  async find(storeId: string): Promise<Store | null> {
    return this.storeRepository.find(storeId);
  }

  async findByName(name: string): Promise<Store | null> {
    return this.storeRepository.findByName(name);
  }

  async update(
    storeId: string,
    updateStoreDto: UpdateStoreDto,
    manager?: EntityManager,
  ): Promise<Store> {
    const updateStore = await this.storeRepository.find(storeId);

    if (!updateStore) {
      throw new UpdateException();
    }

    const existStore = await this.storeRepository.exist(
      updateStoreDto.name,
      updateStore,
    );

    if (existStore) {
      throw new AlreadyExistsException();
    }

    // atualiza o novo store
    return this.storeRepository.update(updateStore, updateStoreDto, manager);
  }

  async delete(storeId: string): Promise<boolean> {
    return this.storeRepository.delete(storeId);
  }
}
