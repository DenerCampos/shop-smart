import { Test, TestingModule } from '@nestjs/testing';
import { CoinController } from '../coin.controller';
import { CoinService } from '../coin.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('CoinController', () => {
  let controller: CoinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinController],
      providers: [
        { provide: CoinService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CoinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
