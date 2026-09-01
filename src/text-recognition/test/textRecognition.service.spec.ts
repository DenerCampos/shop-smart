import { Test, TestingModule } from '@nestjs/testing';
import { TextRecognitionService } from '../textRecognition.service';
import { AppConfig } from '../../common/app-config/app.config';
import { GroupService } from '../../group/group.service';
import { TextRecognitionProviderFactory } from '../providers/factory/text-recognition-provider.factory';
import { User } from '../../user/entities/user.entity';
import { TextRecognitionException } from '../exceptions/textRecognition.exception';
import { AiProviderException } from '../../common/ai-provider/ai-provider.exception';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('TextRecognitionService', () => {
  let service: TextRecognitionService;
  let providerFactory: { getProvider: jest.Mock };
  let repository: { create: jest.Mock };

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
    providerFactory = { getProvider: jest.fn() };
    repository = { create: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextRecognitionService,
        {
          provide: 'ITextRecognitionRepository',
          useValue: repository,
        },
        {
          provide: GroupService,
          useValue: { findAllNames: jest.fn().mockResolvedValue([]) },
        },
        { provide: AppConfig, useValue: createAppConfigMock() },
        {
          provide: TextRecognitionProviderFactory,
          useValue: providerFactory,
        },
      ],
    }).compile();

    service = module.get(TextRecognitionService);
  });

  it('parseShoppingListItem rejeita texto vazio', async () => {
    await expect(
      service.parseShoppingListItem('   ', user()),
    ).rejects.toBeInstanceOf(TextRecognitionException);
  });

  it('parseShoppingListItem propaga AI_PROVIDER_ERROR quando o modelo falha', async () => {
    providerFactory.getProvider.mockResolvedValue({
      name: 'gemini-text',
      analyze: jest.fn().mockRejectedValue(new Error('gemini down')),
    });

    await expect(
      service.parseShoppingListItem('leite', user()),
    ).rejects.toBeInstanceOf(AiProviderException);
  });
});
