import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemModel } from './model/item.model';

@Controller('/item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  create(@Body() createStoreDto: CreateItemDto): Promise<ItemModel> {
    return this.itemService.create(createStoreDto);
  }

  @Get()
  findAll(): Promise<ItemModel[]> {
    return this.itemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<ItemModel> {
    return this.itemService.find(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateStoreDto: UpdateItemDto,
  ): Promise<ItemModel> {
    return this.itemService.update(id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.itemService.delete(id);
  }
}
