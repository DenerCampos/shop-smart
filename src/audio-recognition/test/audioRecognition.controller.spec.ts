import { Test, TestingModule } from '@nestjs/testing';
import { AudioRecognitionController } from '../audioRecognition.controller';
import { AudioRecognitionService } from '../audioRecognition.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('AudioRecognitionController', () => {
  let controller: AudioRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioRecognitionController],
      providers: [
        { provide: AudioRecognitionService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AudioRecognitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
