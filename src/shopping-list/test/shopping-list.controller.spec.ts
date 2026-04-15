import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListController } from '../shopping-list.controller';
import { ShoppingListService } from '../shopping-list.service';
import { ResponseService } from '../../common/response/response';
import { AuthGuard } from '../../auth/auth.guard';

describe('ShoppingListController', () => {
  let controller: ShoppingListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingListController],
      providers: [
        { provide: ShoppingListService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ShoppingListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
