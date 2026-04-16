import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../payment.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
