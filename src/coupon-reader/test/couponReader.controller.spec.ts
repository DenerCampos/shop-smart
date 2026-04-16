import { Test, TestingModule } from '@nestjs/testing';
import { CouponReaderController } from '../couponReader.controller';
import { CouponReaderService } from '../couponReader.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('CouponReaderController', () => {
  let controller: CouponReaderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponReaderController],
      providers: [
        { provide: CouponReaderService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CouponReaderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
