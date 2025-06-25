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
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetValueRevenueCurrentDto } from './dto/get-value-revenue-current.dto';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { RevenueResponseDto } from './dto/revenue-response.dto';
import { RevenueListDto } from './dto/revenue-list.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createStoreDto: CreateRevenueDto,
  ): Promise<RevenueResponseDto> {
    const createRevenue = await this.revenueService.create(
      user,
      createStoreDto,
    );

    return this.responseService.mapToDto(RevenueResponseDto, createRevenue);
  }

  @UseGuards(AuthGuard)
  @Post('confirm-new-month-revenues')
  async confirmNewMonthRevenues(@CurrentUser() user: User): Promise<void> {
    return await this.revenueService.confirmNewMonthRevenues(user);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: RevenueListDto,
  ): Promise<paginationData<RevenueResponseDto>> {
    const revenues = await this.revenueService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(RevenueResponseDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Get('repeated-revenues')
  async getRepeatedRevenues(
    @CurrentUser() user: User,
  ): Promise<RevenueResponseDto[] | []> {
    const revenues = await this.revenueService.getAllByPreviousMonth(user);

    return this.responseService.mapArrayToDto(RevenueResponseDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<RevenueResponseDto[] | []> {
    const revenues = await this.revenueService.getAllByCurrentMonth(user);

    return this.responseService.mapArrayToDto(RevenueResponseDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getRevenueByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<GetValueRevenueCurrentDto> {
    return this.revenueService.getRevenueByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RevenueResponseDto> {
    const revenue = await this.revenueService.find(id);

    return this.responseService.mapToDto(RevenueResponseDto, revenue);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateRevenueDto,
  ): Promise<RevenueResponseDto> {
    const revenue = await this.revenueService.update(id, updateStoreDto);

    return this.responseService.mapToDto(RevenueResponseDto, revenue);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.revenueService.delete(id);

    return { deleted };
  }
}
