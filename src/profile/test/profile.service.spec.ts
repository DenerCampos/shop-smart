import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfileService } from '../profile.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination } from 'src/common/pagination/pagination';
import { UserService } from 'src/user/user.service';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { CoinService } from 'src/coin/coin.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { AuthService } from 'src/auth/auth.service';
import { createTestUser } from 'src/common/test/user.fixture';
import { createAppConfigMock } from 'src/common/test/app-config.mock';
import { CompleteProfileDto } from '../dto/complete-profile.dto';
import { ProfileModel } from '../models/profile.models';
import { Revenue } from 'src/revenue/entities/revenue.entity';
import { Expense } from 'src/expense/entities/expense.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let revenueService: jest.Mocked<
    Pick<
      RevenueService,
      | 'getRevenueByCurrentMonth'
      | 'exist'
      | 'hasRecurringPreviousMonth'
      | 'create'
      | 'getLatest'
      | 'countByUser'
    >
  >;
  let expenseService: jest.Mocked<
    Pick<
      ExpenseService,
      | 'getExpenseByCurrentMonth'
      | 'hasRecurringPreviousMonth'
      | 'getLatest'
      | 'countByUser'
    >
  >;
  let coinService: jest.Mocked<Pick<CoinService, 'getCoinsByUser'>>;
  let googleDriveService: jest.Mocked<
    Pick<
      GoogleDriveService,
      'extractFileIdFromUrl' | 'deleteFile' | 'uploadFile'
    >
  >;
  let userService: jest.Mocked<Pick<UserService, 'update'>>;
  let familyMemberResolver: jest.Mocked<
    Pick<FamilyMemberResolverService, 'resolve'>
  >;
  let authService: jest.Mocked<
    Pick<AuthService, 'getIntegrations' | 'unlinkIntegration'>
  >;

  beforeEach(async () => {
    revenueService = {
      getRevenueByCurrentMonth: jest.fn().mockResolvedValue({ value: 100 }),
      exist: jest.fn().mockResolvedValue(true),
      hasRecurringPreviousMonth: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      getLatest: jest.fn().mockResolvedValue([]),
      countByUser: jest.fn().mockResolvedValue(0),
    };
    expenseService = {
      getExpenseByCurrentMonth: jest.fn().mockResolvedValue({ value: 50 }),
      hasRecurringPreviousMonth: jest.fn().mockResolvedValue(true),
      getLatest: jest.fn().mockResolvedValue([]),
      countByUser: jest.fn().mockResolvedValue(0),
    };
    coinService = {
      getCoinsByUser: jest.fn().mockResolvedValue(25),
    };
    googleDriveService = {
      extractFileIdFromUrl: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn().mockResolvedValue({
        fileId: 'f1',
        fileName: 'x',
        webViewLink: 'w',
        webContentLink: 'https://drive.google.com/uc?export=view&id=f1',
      }),
    };
    userService = {
      update: jest.fn().mockImplementation(async (_id, data) => {
        return { ...createTestUser(), ...data } as Awaited<
          ReturnType<UserService['update']>
        >;
      }),
    };
    familyMemberResolver = {
      resolve: jest.fn().mockResolvedValue({ userIds: ['user-test-1'] }),
    };
    authService = {
      getIntegrations: jest.fn().mockResolvedValue({ alexa: 'linked' }),
      unlinkIntegration: jest.fn().mockResolvedValue({ unlinked: true }),
    };

    const appConfig = {
      ...createAppConfigMock(),
      getBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: AppConfig, useValue: appConfig },
        Pagination,
        { provide: UserService, useValue: userService },
        { provide: ExpenseService, useValue: expenseService },
        { provide: RevenueService, useValue: revenueService },
        { provide: CoinService, useValue: coinService },
        { provide: GoogleDriveService, useValue: googleDriveService },
        {
          provide: FamilyMemberResolverService,
          useValue: familyMemberResolver,
        },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get(ProfileService);
  });

  it('getProfile agrega receitas, despesas, moedas e flags', async () => {
    const user = createTestUser();
    const profile = await service.getProfile(user);

    expect(profile).toBeInstanceOf(ProfileModel);
    expect(profile.income).toBe(100);
    expect(profile.expenses).toBe(50);
    expect(profile.coins).toBe(25);
    expect(profile.isFirstAccess).toBe(false);
    expect(profile.hasRecurringRevenues).toBe(false);
    expect(profile.hasRecurringExpenses).toBe(true);
    expect(revenueService.getRevenueByCurrentMonth).toHaveBeenCalledWith(user);
    expect(expenseService.getExpenseByCurrentMonth).toHaveBeenCalledWith(user);
  });

  it('completeProfile cria receita e atualiza família', async () => {
    const user = createTestUser();
    revenueService.create.mockResolvedValue({ id: 'r1' } as Revenue);
    const dto: CompleteProfileDto = {
      name: 'Renda',
      family: 'Silva',
      income: 5000,
      date: '2024-06-01',
      repeatMonthly: true,
    };

    await service.completeProfile(user, dto);

    expect(revenueService.create).toHaveBeenCalledWith(user, {
      name: dto.name,
      value: dto.income,
      repeat: dto.repeatMonthly,
      date: new Date(dto.date),
    });
    expect(userService.update).toHaveBeenCalledWith(user.id, {
      family: dto.family,
    });
  });

  it('completeProfile lança quando receita não é criada', async () => {
    revenueService.create.mockResolvedValue(null as unknown as Revenue);
    const dto: CompleteProfileDto = {
      name: 'X',
      family: 'Y',
      income: 1,
      date: '2024-01-01',
      repeatMonthly: false,
    };

    await expect(
      service.completeProfile(createTestUser(), dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploadProfileImage remove arquivo antigo quando há profileImage', async () => {
    googleDriveService.extractFileIdFromUrl.mockReturnValue('old-id');
    const user = createTestUser({ profileImage: 'https://x?id=old-id' });
    const file = {
      buffer: Buffer.from('i'),
      originalname: 'a.png',
      mimetype: 'image/png',
    } as Express.Multer.File;

    await service.uploadProfileImage(user, file);

    expect(googleDriveService.deleteFile).toHaveBeenCalledWith('old-id');
    expect(googleDriveService.uploadFile).toHaveBeenCalled();
    expect(userService.update).toHaveBeenCalledWith(user.id, {
      profileImage: 'https://drive.google.com/uc?export=view&id=f1',
    });
  });

  it('getLatestRegistrations ordena por data e pagina', async () => {
    const u = createTestUser();
    const older = new Date('2024-01-01');
    const newer = new Date('2024-02-01');
    const exp = { id: 'e1', name: 'E', value: 1, createdAt: older, user: u };
    const rev = { id: 'r1', name: 'R', value: 2, createdAt: newer, user: u };
    expenseService.getLatest.mockResolvedValue([exp as Expense]);
    revenueService.getLatest.mockResolvedValue([rev as Revenue]);
    expenseService.countByUser.mockResolvedValue(1);
    revenueService.countByUser.mockResolvedValue(1);

    const page = await service.getLatestRegistrations(u, 1, 10);

    expect(page.data[0].type).toBe('revenue');
    expect(page.data[1].type).toBe('expense');
    expect(page.meta.totalItems).toBe(2);
  });

  it('getIntegrations e unlinkAlexa delegam ao AuthService', async () => {
    await expect(service.getIntegrations('uid')).resolves.toEqual({
      alexa: 'linked',
    });
    expect(authService.getIntegrations).toHaveBeenCalledWith('uid');

    await expect(service.unlinkAlexa('uid')).resolves.toEqual({
      unlinked: true,
    });
    expect(authService.unlinkIntegration).toHaveBeenCalledWith('uid', 'alexa');
  });
});
