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
import { AuthGuard } from 'src/auth/auth.guard';
import { CoinModel } from './model/coin.model';
import { CoinService } from './coin.service';
import { CreateCoinDto } from './dto/createCoin.dto';
import { UpdateCoinDto } from './dto/updateCoin.dto';
import { UserModel } from 'src/user/model/user.model';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AddCoinDto } from './dto/addCoin.dto';
import { RemoveCoinDto } from './dto/removeCoin.dto';

@Controller('/coin')
export class CoinController {
  // Implementar métodos do controller
  constructor(private readonly coinService: CoinService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @CurrentUser() user: UserModel,
    @Body() createCoinDto: CreateCoinDto,
  ): Promise<CoinModel> {
    return this.coinService.create(user, createCoinDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<CoinModel[]> {
    return this.coinService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CoinModel> {
    return this.coinService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCoinDto: UpdateCoinDto,
  ): Promise<CoinModel> {
    return this.coinService.update(id, updateCoinDto);
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
    @CurrentUser() user: UserModel,
    @Body() addCoinDto: AddCoinDto,
  ): Promise<object> {
    const coin = await this.coinService.addCoins(user, addCoinDto);

    return { coin };
  }

  @UseGuards(AuthGuard)
  @Post('/removeCoins')
  async removeCons(
    @CurrentUser() user: UserModel,
    @Body() removeCoinDto: RemoveCoinDto,
  ): Promise<object> {
    const coin = await this.coinService.removeCoins(user, removeCoinDto);

    return { coin };
  }
}
