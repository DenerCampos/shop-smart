import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
