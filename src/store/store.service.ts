import { Inject, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { IStoreRepository } from './interface/store.repository.interface';
import { Store } from './entities/store.entity';
import { StoreListDto } from './dto/store-list.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { EntityManager } from 'typeorm';

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
