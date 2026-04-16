import { Test, TestingModule } from '@nestjs/testing';
import { ImageRecognitionService } from '../imageRecognition.service';
import { IImageRecognitionRepository } from '../interfaces/imageRecognition.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { GroupService } from '../../group/group.service';
import { PaymentService } from '../../payment/payment.service';
import { ImageRecognitionProviderFactory } from '../providers/factory/image-recognition-provider.factory';
import { User } from '../../user/entities/user.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('ImageRecognitionService', () => {
  let service: ImageRecognitionService;

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
    const imageRecognitionRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const provider = {
      name: 'gemini',
      analyze: jest.fn().mockResolvedValue({ confidence: 0.9 }),
    };
    const providerFactory = {
      getProvider: jest.fn().mockResolvedValue(provider),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageRecognitionService,
        {
          provide: 'IImageRecognitionRepository',
          useValue: imageRecognitionRepository,
        },
        {
          provide: GroupService,
          useValue: { findAllNames: jest.fn().mockResolvedValue(['Alimentação']) },
        },
        {
          provide: PaymentService,
          useValue: {
            getDefaultPayment: jest.fn().mockResolvedValue('Pix'),
          },
        },
        { provide: AppConfig, useValue: createAppConfigMock() },
        {
          provide: ImageRecognitionProviderFactory,
          useValue: providerFactory,
        },
      ],
    }).compile();

    service = module.get(ImageRecognitionService);
  });

  it('analyzeImage persiste resultado e retorna análise do provider', async () => {
    const buf = Buffer.from('fake-image');
    const result = await service.analyzeImage(buf, user(), 'expense');

    expect(result.confidence).toBe(0.9);
  });
});
