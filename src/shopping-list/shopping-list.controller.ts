import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ResponseService } from 'src/common/response/response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { CreateShoppingListItemDto } from './dto/create-shopping-list-item.dto';
import { BulkAddShoppingListItemDto } from './dto/bulk-add-shopping-list-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { ShoppingListFilterDto } from './dto/shopping-list-filter.dto';
import { ItemSuggestionDto } from './dto/item-suggestion.dto';
import { AlexaAddItemDto } from './dto/alexa-add-item.dto';
import { ShoppingListResponseDto } from './dto/shopping-list-response.dto';
import { ShoppingListDetailResponseDto } from './dto/shopping-list-detail-response.dto';
import { ShoppingListItemResponseDto } from './dto/shopping-list-item-response.dto';
import { ItemSuggestionResponseDto } from './dto/item-suggestion-response.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/shopping-lists')
export class ShoppingListController {
  constructor(
    private readonly shoppingListService: ShoppingListService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() dto: CreateShoppingListDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListResponseDto> {
    const list = await this.shoppingListService.create(dto, user);

    return this.responseService.mapToDto(ShoppingListResponseDto, list);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() dto: ShoppingListFilterDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ShoppingListResponseDto>> {
    const lists = await this.shoppingListService.findAll(dto, user);

    return this.responseService.mapPaginatedToDto(
      ShoppingListResponseDto,
      lists,
    );
  }

  @UseGuards(AuthGuard)
  @Get('suggestions')
  async getSuggestions(
    @Query() dto: ItemSuggestionDto,
    @CurrentUser() user: User,
  ): Promise<ItemSuggestionResponseDto[]> {
    const suggestions = await this.shoppingListService.getSuggestions(
      dto.search,
      user,
    );

    return this.responseService.mapArrayToDto(
      ItemSuggestionResponseDto,
      suggestions,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ShoppingListDetailResponseDto> {
    const list = await this.shoppingListService.findOne(id, user);

    return this.shoppingListService.toDetailResponseDto(list);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShoppingListDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListResponseDto> {
    const list = await this.shoppingListService.update(id, dto, user);

    return this.responseService.mapToDto(ShoppingListResponseDto, list);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.shoppingListService.delete(id, user);

    return { deleted };
  }

  @UseGuards(AuthGuard)
  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ShoppingListResponseDto> {
    const list = await this.shoppingListService.complete(id, user);

    return this.responseService.mapToDto(ShoppingListResponseDto, list);
  }

  @UseGuards(AuthGuard)
  @Post(':listId/items/bulk')
  async addBulkItems(
    @Param('listId') listId: string,
    @Body() dto: BulkAddShoppingListItemDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListItemResponseDto[]> {
    const items = await this.shoppingListService.addBulkItems(
      listId,
      dto,
      user,
    );

    return this.responseService.mapArrayToDto(
      ShoppingListItemResponseDto,
      items,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':listId/items')
  async addItem(
    @Param('listId') listId: string,
    @Body() dto: CreateShoppingListItemDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListItemResponseDto> {
    const item = await this.shoppingListService.addItem(listId, dto, user);

    return this.responseService.mapToDto(ShoppingListItemResponseDto, item);
  }

  @UseGuards(AuthGuard)
  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateShoppingListItemDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListItemResponseDto> {
    const item = await this.shoppingListService.updateItem(itemId, dto, user);

    return this.responseService.mapToDto(ShoppingListItemResponseDto, item);
  }

  @UseGuards(AuthGuard)
  @Patch('items/:itemId/toggle')
  async toggleItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ): Promise<ShoppingListItemResponseDto> {
    const item = await this.shoppingListService.toggleItem(itemId, user);

    return this.responseService.mapToDto(ShoppingListItemResponseDto, item);
  }

  @UseGuards(AuthGuard)
  @Delete('items/:itemId')
  async deleteItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    const { deleted } = await this.shoppingListService.deleteItem(itemId, user);

    return { deleted };
  }

  @UseGuards(AuthGuard)
  @Post('alexa/add-item')
  async addItemFromAlexa(
    @Body() dto: AlexaAddItemDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingListItemResponseDto> {
    const item = await this.shoppingListService.addItemFromAlexa(
      user,
      dto.text,
    );

    return this.responseService.mapToDto(ShoppingListItemResponseDto, item);
  }
}
