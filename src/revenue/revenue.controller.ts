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
import { RevenueModel } from './model/revenue.model';
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/createRevenue.dto';
import { UpdateRevenueDto } from './dto/updateRevenue.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserModel } from 'src/user/model/user.model';
import { GetValueRevenueCurrentDto } from './dto/getValueRevenueCurrent.dto';

@Controller('/revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @CurrentUser() user: UserModel,
    @Body() createStoreDto: CreateRevenueDto,
  ): Promise<RevenueModel> {
    return this.revenueService.create(user, createStoreDto);
  }

  @UseGuards(AuthGuard)
  @Post('confirm-new-month-revenues')
  confirmNewMonthRevenues(@CurrentUser() user: UserModel): Promise<void> {
    return this.revenueService.confirmNewMonthRevenues(user);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<RevenueModel[]> {
    return this.revenueService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('repeated-revenues')
  getRepeatedRevenues(
    @CurrentUser() user: UserModel,
  ): Promise<RevenueModel[] | []> {
    return this.revenueService.getAllByPreviousMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: UserModel,
  ): Promise<RevenueModel[] | []> {
    return this.revenueService.getAllByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getRevenueByCurrentMonth(
    @CurrentUser() user: UserModel,
  ): Promise<GetValueRevenueCurrentDto> {
    return this.revenueService.getRevenueByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<RevenueModel> {
    return this.revenueService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateRevenueDto,
  ): Promise<RevenueModel> {
    return this.revenueService.update(id, updateStoreDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.revenueService.delete(id);

    return { deleted };
  }
}
