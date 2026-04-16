import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from '../expense.controller';
import { ExpenseService } from '../expense.service';
import { ResponseService } from '../../common/response/response';
import { AudioRecognitionService } from '../../audio-recognition/audioRecognition.service';
import { ImageRecognitionService } from '../../image-recognition/imageRecognition.service';
import { AuthGuard } from '../../auth/auth.guard';

describe('ExpenseController', () => {
  let controller: ExpenseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [
        { provide: ExpenseService, useValue: {} },
        { provide: ResponseService, useValue: {} },
        { provide: AudioRecognitionService, useValue: {} },
        { provide: ImageRecognitionService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ExpenseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
