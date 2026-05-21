import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { NotExistException } from 'src/exception/notExistException';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { ShoppingList } from 'src/shopping-list/entities/shopping-list.entity';
import { ShoppingListService } from 'src/shopping-list/shopping-list.service';
import { User } from 'src/user/entities/user.entity';
import { Recipe, RecipeIngredient } from './entities/recipe.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeFilterDto } from './dto/recipe-filter.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { IRecipeRepository } from './interfaces/recipe.repository.interface';

const MAX_PHOTOS_PER_RECIPE = 5;
const IMAGE_MIME_REGEX = /^image\/(jpg|jpeg|png|gif|webp)$/;

@Injectable()
export class RecipeService {
  private readonly recipesUrl: string;

  constructor(
    @Inject('IRecipeRepository')
    private readonly repository: IRecipeRepository,
    private readonly appConfig: AppConfig,
    private readonly pagination: Pagination,
    private readonly familyGroupService: FamilyGroupService,
    private readonly shoppingListService: ShoppingListService,
    private readonly googleDriveService: GoogleDriveService,
  ) {
    this.recipesUrl = `${this.appConfig.getBaseUrl()}/recipes`;
  }

  async create(dto: CreateRecipeDto, user: User): Promise<Recipe> {
    let familyGroup = null;

    if (dto.familyGroupId) {
      familyGroup = await this.familyGroupService.findGroupById(
        dto.familyGroupId,
        user.id,
      );
    }

    return this.repository.createRecipe({
      title: dto.title,
      description: dto.description ?? null,
      ingredients: dto.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
      instructions: dto.instructions,
      photos: [],
      createdBy: user,
      familyGroup,
    });
  }

  async findAll(
    dto: RecipeFilterDto,
    user: User,
  ): Promise<paginationData<Recipe>> {
    const offset = this.pagination.getOffset(dto.page, dto.limit);
    const familyGroupIds = await this.getUserFamilyGroupIds(user.id);

    const [recipes, total] = await this.repository.findAllByUser(
      user.id,
      familyGroupIds,
      offset,
      dto.limit,
    );

    return this.pagination.paginateData<Recipe>(
      recipes,
      dto.page,
      dto.limit,
      total,
      this.recipesUrl,
    );
  }

  async findOne(id: string, user: User): Promise<Recipe> {
    const recipe = await this.repository.findById(id);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateRecipeAccess(recipe, user.id);

    return recipe;
  }

  async update(id: string, dto: UpdateRecipeDto, user: User): Promise<Recipe> {
    const recipe = await this.repository.findById(id);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateRecipeAccess(recipe, user.id);

    if (dto.title !== undefined) recipe.title = dto.title;
    if (dto.description !== undefined) recipe.description = dto.description;
    if (dto.ingredients !== undefined) {
      recipe.ingredients = dto.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      }));
    }
    if (dto.instructions !== undefined) recipe.instructions = dto.instructions;

    return this.repository.save(recipe);
  }

  async remove(id: string, user: User): Promise<boolean> {
    const recipe = await this.repository.findById(id);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateDelete(recipe, user.id);
    await this.deleteRecipePhotos(recipe.photos ?? []);

    return this.repository.softRemove(id);
  }

  async uploadPhoto(
    recipeId: string,
    user: User,
    file: Express.Multer.File,
  ): Promise<Recipe> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }

    if (!IMAGE_MIME_REGEX.test(file.mimetype)) {
      throw new BadRequestException(
        'Apenas imagens (jpg, jpeg, png, gif, webp) são permitidas',
      );
    }

    const recipe = await this.repository.findById(recipeId);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateRecipeAccess(recipe, user.id);

    const photos = recipe.photos ?? [];

    if (photos.length >= MAX_PHOTOS_PER_RECIPE) {
      throw new BadRequestException(
        `Limite de ${MAX_PHOTOS_PER_RECIPE} fotos por receita.`,
      );
    }

    const ext =
      file.originalname?.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ||
      'jpg';
    const safeExt = ext.length > 8 ? 'jpg' : ext;
    const fileName = `recipe-${randomUUID()}.${safeExt}`;

    const uploaded = await this.googleDriveService.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
      'recipe',
    );

    recipe.photos = [...photos, uploaded.webContentLink];

    return this.repository.save(recipe);
  }

  async removePhoto(
    recipeId: string,
    user: User,
    photoUrl: string,
  ): Promise<Recipe> {
    const recipe = await this.repository.findById(recipeId);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateRecipeAccess(recipe, user.id);

    const photos = recipe.photos ?? [];
    if (!photos.includes(photoUrl)) {
      throw new BadRequestException('Foto não encontrada nesta receita');
    }

    await this.deleteRecipePhotos([photoUrl]);

    recipe.photos = photos.filter((u) => u !== photoUrl);

    return this.repository.save(recipe);
  }

  async generateShoppingList(
    recipeId: string,
    user: User,
  ): Promise<ShoppingList> {
    const recipe = await this.repository.findById(recipeId);

    if (!recipe) {
      throw new NotExistException();
    }

    await this.validateRecipeAccess(recipe, user.id);

    const listName = `Ingredientes: ${recipe.title}`;

    const existing = await this.shoppingListService.findByNameAndUser(
      listName,
      user,
    );

    if (existing) {
      return this.syncShoppingListItems(existing.id, recipe.ingredients, user);
    }

    const list = await this.shoppingListService.create(
      {
        name: listName,
        familyGroupId: recipe.familyGroup?.id,
      },
      user,
    );

    return this.syncShoppingListItems(list.id, recipe.ingredients, user);
  }

  private async syncShoppingListItems(
    listId: string,
    ingredients: RecipeIngredient[],
    user: User,
  ): Promise<ShoppingList> {
    const list = await this.shoppingListService.findOne(listId, user);

    for (const item of list.items ?? []) {
      await this.shoppingListService.deleteItem(item.id, user);
    }

    const ingredientsText = ingredients
      .map((i) => `${i.quantity} ${i.unit} ${i.name}`)
      .join(', ');

    await this.shoppingListService.addBulkItems(
      listId,
      { text: ingredientsText },
      user,
    );

    return this.shoppingListService.findOne(listId, user);
  }

  private async deleteRecipePhotos(photos: string[]): Promise<void> {
    for (const photoUrl of photos) {
      const fileId = this.googleDriveService.extractFileIdFromUrl(photoUrl);
      if (fileId) {
        await this.googleDriveService.deleteFile(fileId);
      }
    }
  }

  private async validateRecipeAccess(
    recipe: Recipe,
    userId: string,
  ): Promise<void> {
    const familyGroupId = recipe.familyGroup?.id ?? null;

    if (!familyGroupId) {
      if (recipe.createdBy?.id !== userId) {
        throw new ForbiddenException('Você não tem acesso a esta receita.');
      }
      return;
    }

    const userFamilyGroupIds = await this.getUserFamilyGroupIds(userId);

    if (!userFamilyGroupIds.includes(familyGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta receita.');
    }
  }

  private async validateDelete(recipe: Recipe, userId: string): Promise<void> {
    if (recipe.createdBy?.id !== userId) {
      throw new ForbiddenException(
        'Apenas quem criou a receita pode excluí-la.',
      );
    }
  }

  private async getUserFamilyGroupIds(userId: string): Promise<string[]> {
    try {
      const groups = await this.familyGroupService.findGroupsByUser(userId);
      return groups.map((g) => g.id);
    } catch {
      return [];
    }
  }
}
