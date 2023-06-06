import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreModel } from './model/store.model';

@Controller('/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  create(@Body() createStoreDto: CreateStoreDto): Promise<StoreModel> {
    return this.storeService.create(createStoreDto);
  }

  @Get()
  findAll(): Promise<StoreModel[]> {
    return this.storeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<StoreModel> {
    return this.storeService.find(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    return this.storeService.update(id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<StoreModel> {
    return this.storeService.remove(id);
  }
}
