import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Recipe,
  RecipeIngredient,
} from '../entities/recipe.entity';

export interface IRecipeRepository {
  createRecipe(params: {
    title: string;
    description: string | null;
    ingredients: RecipeIngredient[];
    instructions: string;
    photos: string[];
    createdBy: User;
    familyGroup: FamilyGroup | null;
  }): Promise<Recipe>;

  findById(id: string): Promise<Recipe | null>;

  findAllByUser(
    userId: string,
    familyGroupIds: string[],
    offset: number,
    limit: number,
  ): Promise<[Recipe[], number]>;

  save(recipe: Recipe): Promise<Recipe>;

  softRemove(id: string): Promise<boolean>;
}
