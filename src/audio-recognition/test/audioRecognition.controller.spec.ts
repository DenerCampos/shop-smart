import { Test, TestingModule } from '@nestjs/testing';
import { AudioRecognitionController } from '../audioRecognition.controller';

describe('AudioRecognitionController', () => {
  let controller: AudioRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioRecognitionController],
    }).compile();

    controller = module.get<AudioRecognitionController>(
      AudioRecognitionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
