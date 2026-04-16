import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from '../theme.controller';
import { ThemeService } from '../theme.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('ThemeController', () => {
  let controller: ThemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [
        { provide: ThemeService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ThemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
