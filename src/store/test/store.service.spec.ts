import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from '../store.service';
import { IStoreRepository } from '../interface/store.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('StoreService', () => {
  let service: StoreService;
  let storeRepository: jest.Mocked<
    Pick<IStoreRepository, 'findAll' | 'find' | 'getAllNames' | 'create'>
  >;

  beforeEach(async () => {
    storeRepository = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
      getAllNames: jest.fn().mockResolvedValue(['A', 'B']),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: 'IStoreRepository', useValue: storeRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
      ],
    }).compile();

    service = module.get(StoreService);
  });

  it('getAllNames delega ao repositório', async () => {
    const names = await service.getAllNames(50);
    expect(names).toEqual(['A', 'B']);
    expect(storeRepository.getAllNames).toHaveBeenCalledWith(50);
  });

  it('update lança UpdateException quando loja não existe', async () => {
    storeRepository.find.mockResolvedValue(null);

    await expect(
      service.update('x', { name: 'y' } as any),
    ).rejects.toBeInstanceOf(UpdateException);
  });
});
