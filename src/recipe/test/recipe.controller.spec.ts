import { Test, TestingModule } from '@nestjs/testing';
import { RecipeController } from '../recipe.controller';
import { RecipeService } from '../recipe.service';
import { ResponseService } from '../../common/response/response';
import { ShoppingListService } from '../../shopping-list/shopping-list.service';
import { AuthGuard } from '../../auth/auth.guard';

describe('RecipeController', () => {
  let controller: RecipeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeController],
      providers: [
        { provide: RecipeService, useValue: {} },
        { provide: ShoppingListService, useValue: {} },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RecipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
