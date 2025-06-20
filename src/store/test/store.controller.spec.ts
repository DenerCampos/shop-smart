import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from '../store.controller';
import { StoreService } from '../store.service';

describe('StoreController', () => {
  let storeController: StoreController;

  beforeEach(async () => {
    const store: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [StoreService],
    }).compile();

    storeController = store.get<StoreController>(StoreController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(storeController.findAll()).toBe([]);
    });
  });
});
