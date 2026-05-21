import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { FamilyGroupModule } from 'src/family-group/family-group.module';
import { GoogleDriveModule } from 'src/google-drive/google-drive.module';
import { ShoppingListModule } from 'src/shopping-list/shopping-list.module';
import { UserModule } from 'src/user/user.module';
import { Recipe } from './entities/recipe.entity';
import { RecipeRepository } from './repositories/recipe.repository';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

@Module({
  imports: [
    CommonModule,
    UserModule,
    FamilyGroupModule,
    GoogleDriveModule,
    ShoppingListModule,
    TypeOrmModule.forFeature([Recipe]),
  ],
  controllers: [RecipeController],
  providers: [
    RecipeService,
    { provide: 'IRecipeRepository', useClass: RecipeRepository },
  ],
  exports: [RecipeService],
})
export class RecipeModule {}
