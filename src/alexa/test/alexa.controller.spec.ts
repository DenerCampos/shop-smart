import { Test, TestingModule } from '@nestjs/testing';
import { AlexaController } from '../alexa.controller';
import { AlexaService } from '../alexa.service';
import { AlexaIntentRequestDto } from '../dto/alexa-intent-request.dto';

describe('AlexaController', () => {
  let controller: AlexaController;
  let alexaService: { handleIntent: jest.Mock };

  beforeEach(async () => {
    alexaService = {
      handleIntent: jest.fn().mockResolvedValue({ version: '1.0', response: {} }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlexaController],
      providers: [{ provide: AlexaService, useValue: alexaService }],
    }).compile();

    controller = module.get(AlexaController);
  });

  it('handleIntent delega ao AlexaService', async () => {
    const dto = { request: {} } as AlexaIntentRequestDto;
    const res = await controller.handleIntent(dto);
    expect(alexaService.handleIntent).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ version: '1.0', response: {} });
  });
});
