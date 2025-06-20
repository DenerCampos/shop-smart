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
import { AuthGuard } from 'src/auth/auth.guard';
import { CoinService } from './coin.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AddCoinDto } from './dto/add-coin.dto';
import { RemoveCoinDto } from './dto/remove-coin.dto';
import { User } from 'src/user/entities/user.entity';
import { ResponseService } from 'src/common/response/response';
import { CoinResponseDto } from './dto/coin-response.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { CoinListDto } from './dto/coin-list.dto';

@Controller('/coin')
export class CoinController {
  constructor(
    private readonly coinService: CoinService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createCoinDto: CreateCoinDto,
  ): Promise<CoinResponseDto> {
    const createCoin = await this.coinService.create(user, createCoinDto);

    return this.responseService.mapToDto(CoinResponseDto, createCoin);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: CoinListDto,
  ): Promise<paginationData<CoinResponseDto>> {
    const coins = await this.coinService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(CoinResponseDto, coins);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CoinResponseDto> {
    const coin = await this.coinService.find(id);

    return this.responseService.mapToDto(CoinResponseDto, coin);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCoinDto: UpdateCoinDto,
  ): Promise<CoinResponseDto> {
    const coin = await this.coinService.update(id, updateCoinDto);

    return this.responseService.mapToDto(CoinResponseDto, coin);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.coinService.delete(id);

    return { deleted };
  }

  @UseGuards(AuthGuard)
  @Post('/addCoins')
  async addCons(
    @CurrentUser() user: User,
    @Body() addCoinDto: AddCoinDto,
  ): Promise<object> {
    const coin = await this.coinService.addCoins(user, addCoinDto);

    return this.responseService.mapToDto(CoinResponseDto, coin);
  }

  @UseGuards(AuthGuard)
  @Post('/removeCoins')
  async removeCons(
    @CurrentUser() user: User,
    @Body() removeCoinDto: RemoveCoinDto,
  ): Promise<object> {
    const coin = await this.coinService.removeCoins(user, removeCoinDto);

    return this.responseService.mapToDto(CoinResponseDto, coin);
  }
}
