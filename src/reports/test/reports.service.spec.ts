import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { IReportsRepository } from '../interfaces/reports.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { User } from '../../user/entities/user.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepository: jest.Mocked<
    Pick<IReportsRepository, 'expenseByGroup'>
  >;
  let familyGroupService: jest.Mocked<
    Pick<
      FamilyGroupService,
      'getAcceptedMemberUserIdsIfAdmin' | 'getAcceptedMemberUserIds'
    >
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
    reportsRepository = {
      expenseByGroup: jest.fn().mockResolvedValue([]),
    };
    familyGroupService = {
      getAcceptedMemberUserIdsIfAdmin: jest.fn().mockResolvedValue(['u1']),
      getAcceptedMemberUserIds: jest.fn().mockResolvedValue(['u1']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: 'IReportsRepository', useValue: reportsRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        { provide: FamilyGroupService, useValue: familyGroupService },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('expenseByGroup resolve userIds e chama repositório', async () => {
    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    } as any;

    await service.expenseByGroup(user(), dto);

    expect(
      familyGroupService.getAcceptedMemberUserIdsIfAdmin,
    ).toHaveBeenCalledWith('u1');
    expect(reportsRepository.expenseByGroup).toHaveBeenCalledWith(
      ['u1'],
      dto.startDate,
      dto.endDate,
    );
  });
});
