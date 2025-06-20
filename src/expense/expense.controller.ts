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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ResponseService } from 'src/common/response/response';
import { ExpenseListDto } from './dto/expense-list.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { ValueExpenseCurrentResponseDto } from './dto/value-expense-current-response.dto';

@Controller('/expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const createExpense = await this.expenseService.create(
      user,
      createExpenseDto,
    );

    return this.responseService.mapToDto(ExpenseResponseDto, createExpense);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: ExpenseListDto,
  ): Promise<paginationData<ExpenseResponseDto>> {
    const expenses = await this.expenseService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(ExpenseResponseDto, expenses);
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<ExpenseResponseDto[] | []> {
    const expenses = await this.expenseService.getAllByCurrentMonth(user);

    return this.responseService.mapArrayToDto(ExpenseResponseDto, expenses);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getExpenseByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<ValueExpenseCurrentResponseDto> {
    return this.expenseService.getExpenseByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseService.find(id);

    return this.responseService.mapToDto(ExpenseResponseDto, expense);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenseService.update(id, updateExpenseDto);

    return this.responseService.mapToDto(ExpenseResponseDto, expense);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.expenseService.delete(id);

    return { deleted };
  }
}
