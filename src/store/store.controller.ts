import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { CreateStoreDto } from './dto/createStore.dto';
import { StoreModel } from './model/store.model';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createStoreDto: CreateStoreDto): Promise<StoreModel> {
    return this.storeService.create(createStoreDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<StoreModel[]> {
    return this.storeService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<StoreModel> {
    return this.storeService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ): Promise<StoreModel> {
    return this.storeService.update(id, updateStoreDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.storeService.delete(id);

    return { deleted };
  }
}
