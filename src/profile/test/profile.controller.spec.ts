import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProfileController } from '../profile.controller';
import { ProfileService } from '../profile.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';
import { createTestUser } from 'src/common/test/user.fixture';
import { ProfileModel } from '../models/profile.models';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: jest.Mocked<
    Pick<
      ProfileService,
      | 'completeProfile'
      | 'getProfile'
      | 'getLatestRegistrations'
      | 'getIntegrations'
      | 'unlinkAlexa'
      | 'uploadProfileImage'
    >
  >;
  let responseService: jest.Mocked<
    Pick<ResponseService, 'mapToDto' | 'mapPaginatedToDto'>
  >;

  beforeEach(async () => {
    profileService = {
      completeProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn(),
      getLatestRegistrations: jest.fn(),
      getIntegrations: jest.fn(),
      unlinkAlexa: jest.fn(),
      uploadProfileImage: jest.fn(),
    };
    responseService = {
      mapToDto: jest.fn().mockImplementation((_dto, x) => x),
      mapPaginatedToDto: jest.fn().mockImplementation((_dto, x) => x),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: ResponseService, useValue: responseService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProfileController);
  });

  it('profile chama getProfile e mapeia DTO', async () => {
    const u = createTestUser();
    const model = new ProfileModel({
      user: u,
      income: 1,
      expenses: 2,
      coins: 3,
      isFirstAccess: false,
      hasRecurringRevenues: false,
      hasRecurringExpenses: false,
    });
    profileService.getProfile.mockResolvedValue(model);

    const result = await controller.profile(u);

    expect(profileService.getProfile).toHaveBeenCalledWith(u);
    expect(responseService.mapToDto).toHaveBeenCalled();
    expect(result).toEqual(model);
  });

  it('completeProfile delega ao serviço', async () => {
    const u = createTestUser();
    const dto = { name: 'a', family: 'b', income: 1, date: '2024-01-01' };
    await controller.completeProfile(u, dto as never);
    expect(profileService.completeProfile).toHaveBeenCalledWith(u, dto);
  });

  it('getLatestRegistrations repassa page e limit', async () => {
    const u = createTestUser();
    const paginated = { data: [], meta: {}, links: {} };
    profileService.getLatestRegistrations.mockResolvedValue(paginated as never);

    await controller.getLatestRegistrations({ page: 2, limit: 5 } as never, u);

    expect(profileService.getLatestRegistrations).toHaveBeenCalledWith(u, 2, 5);
    expect(responseService.mapPaginatedToDto).toHaveBeenCalled();
  });

  it('uploadProfileImage exige arquivo e tipo MIME válido', async () => {
    const u = createTestUser();
    await expect(
      controller.uploadProfileImage(u, undefined as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.uploadProfileImage(u, {
        mimetype: 'application/pdf',
        size: 100,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.uploadProfileImage(u, {
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploadProfileImage válido delega ao serviço e mapeia usuário', async () => {
    const u = createTestUser();
    const file = {
      mimetype: 'image/jpeg',
      size: 100,
      buffer: Buffer.from('x'),
      originalname: 'a.jpg',
    } as Express.Multer.File;
    const updated = createTestUser({ name: 'Atualizado' });
    profileService.uploadProfileImage.mockResolvedValue(updated);

    const out = await controller.uploadProfileImage(u, file);

    expect(profileService.uploadProfileImage).toHaveBeenCalledWith(u, file);
    expect(responseService.mapToDto).toHaveBeenCalled();
    expect(out).toEqual(updated);
  });
});
