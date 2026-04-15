import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '../group.service';
import { IGroupRepository } from '../interfaces/group.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { User } from '../../user/entities/user.entity';
import { Group } from '../entities/group.entity';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: jest.Mocked<
    Pick<IGroupRepository, 'findAll' | 'find' | 'create'>
  >;

  const user = (): User => {
    const u = new User();
    u.id = 'u1';
    u.email = 'e@t.l';
    u.name = 'n';
    u.family = 'f';
    u.coatOfArms = '/c';
    u.password = 'p';
    return u;
  };

  beforeEach(async () => {
    groupRepository = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: 'IGroupRepository', useValue: groupRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
      ],
    }).compile();

    service = module.get(GroupService);
  });

  it('findAll pagina com repositório', async () => {
    await service.findAll({ page: 2, limit: 5, search: 'a' } as any, user());

    expect(groupRepository.findAll).toHaveBeenCalledWith(
      user(),
      expect.any(Number),
      5,
      'a',
    );
  });

  it('update lança UpdateException quando grupo não existe', async () => {
    groupRepository.find.mockResolvedValue(null);

    await expect(
      service.update('missing', { name: 'x' } as any),
    ).rejects.toBeInstanceOf(UpdateException);
  });
});
