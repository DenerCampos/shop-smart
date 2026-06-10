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
    Pick<
      IReportsRepository,
      'expenseByGroup' | 'expenseByGroupedMonth' | 'revenueByGroupedMonth'
    >
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
      expenseByGroupedMonth: jest.fn().mockResolvedValue([
        { month: '2026-06', totalExpenses: 100 },
      ]),
      revenueByGroupedMonth: jest.fn().mockResolvedValue([
        { month: '2026-06', totalRevenues: 200 },
      ]),
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

  it('expensesIncomeComparison retorna 12 meses do ano com zeros', async () => {
    const result = await service.expensesIncomeComparison(user(), {
      year: '2026',
    } as never);

    expect(result).toHaveLength(12);
    expect(result[0].month).toBe('2026-01');
    expect(result[0].totalExpenses).toBe(0);
    expect(result[5].month).toBe('2026-06');
    expect(result[5].totalExpenses).toBe(100);
    expect(result[5].totalRevenues).toBe(200);
    expect(result[11].month).toBe('2026-12');
  });
});
