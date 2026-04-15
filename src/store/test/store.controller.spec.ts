import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from '../store.controller';
import { StoreService } from '../store.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('StoreController', () => {
  let controller: StoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        { provide: StoreService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(StoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
