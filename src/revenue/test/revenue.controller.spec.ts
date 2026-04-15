import { Test, TestingModule } from '@nestjs/testing';
import { RevenueController } from '../revenue.controller';
import { RevenueService } from '../revenue.service';
import { ResponseService } from '../../common/response/response';
import { AudioRecognitionService } from '../../audio-recognition/audioRecognition.service';
import { ImageRecognitionService } from '../../image-recognition/imageRecognition.service';
import { AuthGuard } from '../../auth/auth.guard';

describe('RevenueController', () => {
  let controller: RevenueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevenueController],
      providers: [
        { provide: RevenueService, useValue: {} },
        { provide: ResponseService, useValue: {} },
        { provide: AudioRecognitionService, useValue: {} },
        { provide: ImageRecognitionService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RevenueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
