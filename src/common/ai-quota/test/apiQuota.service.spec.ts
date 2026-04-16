import { Test, TestingModule } from '@nestjs/testing';
import { ApiQuotaService } from '../services/apiQuota.service';
import { IApiUsageRepository } from '../interfaces/apiUsage.repository.interface';
import { ApiQuotaException } from '../exceptions/apiQuota.exception';

describe('ApiQuotaService', () => {
  let service: ApiQuotaService;
  let apiUsageRepository: jest.Mocked<IApiUsageRepository>;

  beforeEach(async () => {
    apiUsageRepository = {
      findByProviderAndDate: jest.fn(),
      create: jest.fn(),
      incrementCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiQuotaService,
        { provide: 'IApiUsageRepository', useValue: apiUsageRepository },
      ],
    }).compile();

    service = module.get(ApiQuotaService);
  });

  it('checkAndIncrementQuota lança ApiQuotaException quando limite atingido', async () => {
    apiUsageRepository.findByProviderAndDate.mockResolvedValue({
      id: 'u1',
      provider: 'gemini',
      requestCount: 100,
      dailyLimit: 100,
      date: new Date(),
    } as any);

    await expect(
      service.checkAndIncrementQuota('gemini', 100),
    ).rejects.toBeInstanceOf(ApiQuotaException);

    expect(apiUsageRepository.incrementCount).not.toHaveBeenCalled();
  });

  it('checkAndIncrementQuota incrementa quando abaixo do limite', async () => {
    apiUsageRepository.findByProviderAndDate.mockResolvedValue({
      id: 'u1',
      provider: 'gemini',
      requestCount: 5,
      dailyLimit: 100,
      date: new Date(),
    } as any);

    await service.checkAndIncrementQuota('gemini', 100);

    expect(apiUsageRepository.incrementCount).toHaveBeenCalledWith('u1');
  });
});
