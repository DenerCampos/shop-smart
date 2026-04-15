import { Test, TestingModule } from '@nestjs/testing';
import { TextRecognitionController } from '../textRecognition.controller';
import { TextRecognitionService } from '../textRecognition.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('TextRecognitionController', () => {
  let controller: TextRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextRecognitionController],
      providers: [
        { provide: TextRecognitionService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(TextRecognitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
