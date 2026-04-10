import { Test, TestingModule } from '@nestjs/testing';
import { TextRecognitionController } from '../textRecognition.controller';

describe('TextRecognitionController', () => {
  let controller: TextRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextRecognitionController],
    }).compile();

    controller = module.get<TextRecognitionController>(
      TextRecognitionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
