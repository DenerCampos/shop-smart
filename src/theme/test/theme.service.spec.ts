import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { ThemeService } from '../theme.service';
import { IThemeRepository } from '../interfaces/theme.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('ThemeService', () => {
  let service: ThemeService;
  let themeRepository: jest.Mocked<
    Pick<IThemeRepository, 'findAll' | 'find' | 'create' | 'update'>
  >;

  beforeEach(async () => {
    themeRepository = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeService,
        { provide: 'IThemeRepository', useValue: themeRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: EVENT_EMITTER, useValue: new EventEmitter() },
      ],
    }).compile();

    service = module.get(ThemeService);
  });

  it('findAll usa paginação', async () => {
    await service.findAll({ page: 1, limit: 20, search: 'dark' } as any);

    expect(themeRepository.findAll).toHaveBeenCalledWith(
      expect.any(Number),
      20,
      'dark',
    );
  });

  it('update lança UpdateException quando tema não existe', async () => {
    themeRepository.find.mockResolvedValue(null);

    await expect(
      service.update('x', { name: 'y' } as any),
    ).rejects.toBeInstanceOf(UpdateException);
  });
});
