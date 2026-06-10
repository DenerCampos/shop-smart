import { Test, TestingModule } from '@nestjs/testing';
import { AudioRecognitionService } from '../audioRecognition.service';
import { AppConfig } from '../../common/app-config/app.config';
import { GroupService } from '../../group/group.service';
import { PaymentService } from '../../payment/payment.service';
import { AudioRecognitionProviderFactory } from '../providers/factory/audio-recognition-provider.factory';
import { User } from '../../user/entities/user.entity';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('AudioRecognitionService', () => {
  let service: AudioRecognitionService;

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
    const audioRecognitionRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const provider = {
      name: 'gemini-audio',
      analyze: jest.fn().mockResolvedValue({ confidence: 0.8 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioRecognitionService,
        {
          provide: 'IAudioRecognitionRepository',
          useValue: audioRecognitionRepository,
        },
        {
          provide: GroupService,
          useValue: { findAllNames: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: PaymentService,
          useValue: {
            getDefaultPayment: jest.fn().mockResolvedValue('Pix'),
          },
        },
        { provide: AppConfig, useValue: createAppConfigMock() },
        {
          provide: AudioRecognitionProviderFactory,
          useValue: { getProvider: jest.fn().mockResolvedValue(provider) },
        },
      ],
    }).compile();

    service = module.get(AudioRecognitionService);
  });

  it('analyzeAudio rejeita buffer vazio', async () => {
    await expect(
      service.analyzeAudio(Buffer.alloc(0), 'audio/wav', user()),
    ).rejects.toThrow(/inválido/);
  });

  it('analyzeAudio retorna resultado do provider', async () => {
    const buf = Buffer.from('wav-bytes');
    const result = await service.analyzeAudio(buf, 'audio/wav', user());

    expect(result.confidence).toBe(0.8);
  });
});
