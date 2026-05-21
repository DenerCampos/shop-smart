import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { paginationData } from 'src/common/pagination/pagination';
import { User } from 'src/user/entities/user.entity';
import { ShoppingListDetailResponseDto } from 'src/shopping-list/dto/shopping-list-detail-response.dto';
import { ShoppingListService } from 'src/shopping-list/shopping-list.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeFilterDto } from './dto/recipe-filter.dto';
import { RecipeResponseDto } from './dto/recipe-response.dto';
import { RemoveRecipePhotoDto } from './dto/remove-recipe-photo.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeService } from './recipe.service';

@Controller('/recipes')
export class RecipeController {
  constructor(
    private readonly recipeService: RecipeService,
    private readonly shoppingListService: ShoppingListService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateRecipeDto,
    @CurrentUser() user: User,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.create(dto, user);
    return this.responseService.mapToDto(RecipeResponseDto, recipe);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() dto: RecipeFilterDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<RecipeResponseDto>> {
    const data = await this.recipeService.findAll(dto, user);

    return this.responseService.mapPaginatedToDto(RecipeResponseDto, data);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.findOne(id, user);

    return this.responseService.mapToDto(RecipeResponseDto, recipe);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @CurrentUser() user: User,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.update(id, dto, user);

    return this.responseService.mapToDto(RecipeResponseDto, recipe);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.recipeService.remove(id, user);

    return { deleted };
  }

  @UseGuards(AuthGuard)
  @Post(':id/photos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 1.5 * 1024 * 1024, files: 1 },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<RecipeResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo photo é obrigatório');
    }

    const recipe = await this.recipeService.uploadPhoto(id, user, file);

    return this.responseService.mapToDto(RecipeResponseDto, recipe);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/photos')
  async removePhoto(
    @Param('id') id: string,
    @Body() dto: RemoveRecipePhotoDto,
    @CurrentUser() user: User,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.removePhoto(id, user, dto.photoUrl);

    return this.responseService.mapToDto(RecipeResponseDto, recipe);
  }

  @UseGuards(AuthGuard)
  @Post(':id/shopping-list')
  @HttpCode(HttpStatus.CREATED)
  async generateShoppingList(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ShoppingListDetailResponseDto> {
    const list = await this.recipeService.generateShoppingList(id, user);

    return this.shoppingListService.toDetailResponseDto(list);
  }
}
