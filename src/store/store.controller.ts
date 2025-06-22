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
import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { StoreResponseDto } from './dto/store-response.dto';
import { ResponseService } from 'src/common/response/response';
import { StoreListDto } from './dto/store-list.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createStoreDto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    const createStore = await this.storeService.create(createStoreDto);

    return this.responseService.mapToDto(StoreResponseDto, createStore);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: StoreListDto,
  ): Promise<paginationData<StoreResponseDto>> {
    const stores = await this.storeService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(StoreResponseDto, stores);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StoreResponseDto> {
    const store = await this.storeService.find(id);

    return this.responseService.mapToDto(StoreResponseDto, store);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    const store = await this.storeService.update(id, updateStoreDto);

    return this.responseService.mapToDto(StoreResponseDto, store);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.storeService.delete(id);

    return { deleted };
  }
}
