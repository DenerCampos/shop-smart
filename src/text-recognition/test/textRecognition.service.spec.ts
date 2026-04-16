import { Test, TestingModule } from '@nestjs/testing';
import { TextRecognitionService } from '../textRecognition.service';
import { ITextRecognitionRepository } from '../interfaces/textRecognition.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { GroupService } from '../../group/group.service';
import { TextRecognitionProviderFactory } from '../providers/factory/text-recognition-provider.factory';
import { User } from '../../user/entities/user.entity';
import { TextRecognitionException } from '../exceptions/textRecognition.exception';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('TextRecognitionService', () => {
  let service: TextRecognitionService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextRecognitionService,
        {
          provide: 'ITextRecognitionRepository',
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: GroupService, useValue: {} },
        { provide: AppConfig, useValue: createAppConfigMock() },
        {
          provide: TextRecognitionProviderFactory,
          useValue: { getProvider: jest.fn() },
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
});
