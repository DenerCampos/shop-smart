import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from '../group.controller';
import { GroupService } from '../group.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('GroupController', () => {
  let controller: GroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
