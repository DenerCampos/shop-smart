import { Test, TestingModule } from '@nestjs/testing';
import { ImageRecognitionController } from '../imageRecognition.controller';
import { ImageRecognitionService } from '../imageRecognition.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('ImageRecognitionController', () => {
  let controller: ImageRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageRecognitionController],
      providers: [
        { provide: ImageRecognitionService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ImageRecognitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
