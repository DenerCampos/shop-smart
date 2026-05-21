import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { User } from 'src/user/entities/user.entity';
import { Recipe, RecipeIngredient } from '../entities/recipe.entity';
import { IRecipeRepository } from '../interfaces/recipe.repository.interface';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  constructor(
    @InjectRepository(Recipe)
    private readonly repo: Repository<Recipe>,
  ) {}

  async createRecipe(params: {
    title: string;
    description: string | null;
    ingredients: RecipeIngredient[];
    instructions: string;
    photos: string[];
    createdBy: User;
    familyGroup: FamilyGroup | null;
  }): Promise<Recipe> {
    const recipe = this.repo.create({
      title: params.title,
      description: params.description,
      ingredients: params.ingredients,
      instructions: params.instructions,
      photos: params.photos.length ? params.photos : [],
      createdBy: params.createdBy,
      familyGroup: params.familyGroup,
    });

    const saved = await this.repo.save(recipe);
    return this.findById(saved.id) as Promise<Recipe>;
  }

  async findById(id: string): Promise<Recipe | null> {
    return this.repo
      .createQueryBuilder('recipe')
      .leftJoin('recipe.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('recipe.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .where('recipe.id = :id', { id })
      .andWhere('recipe.deletedAt IS NULL')
      .getOne();
  }

  async findAllByUser(
    userId: string,
    familyGroupIds: string[],
    offset: number,
    limit: number,
  ): Promise<[Recipe[], number]> {
    const qb = this.repo
      .createQueryBuilder('recipe')
      .leftJoin('recipe.familyGroup', 'familyGroup')
      .addSelect(['familyGroup.id', 'familyGroup.name'])
      .leftJoin('recipe.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.name', 'createdBy.profileImage'])
      .where('recipe.deletedAt IS NULL');

    if (familyGroupIds.length > 0) {
      qb.andWhere(
        '(recipe.createdById = :userId OR recipe.familyGroupId IN (:...familyGroupIds))',
        { userId, familyGroupIds },
      );
    } else {
      qb.andWhere('recipe.createdById = :userId', { userId });
    }

    qb.orderBy('recipe.updatedAt', 'DESC').skip(offset).take(limit);

    return qb.getManyAndCount();
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const updated = await this.repo.save(recipe);
    return this.findById(updated.id) as Promise<Recipe>;
  }

  async softRemove(id: string): Promise<boolean> {
    const result = await this.repo.softDelete({ id });
    return result.affected === 1;
  }
}
