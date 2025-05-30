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
import { ExpenseModel } from './model/expense.model';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { UserModel } from 'src/user/model/user.model';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetValueExpenseCurrentDto } from './dto/getValueExpenseCurrent.dto';

@Controller('/expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @CurrentUser() user: UserModel,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseModel> {
    return this.expenseService.create(user, createExpenseDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<ExpenseModel[]> {
    return this.expenseService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: UserModel,
  ): Promise<ExpenseModel[] | []> {
    return this.expenseService.getAllByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getExpenseByCurrentMonth(
    @CurrentUser() user: UserModel,
  ): Promise<GetValueExpenseCurrentDto> {
    return this.expenseService.getExpenseByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ExpenseModel> {
    return this.expenseService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseModel> {
    return this.expenseService.update(id, updateExpenseDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.expenseService.delete(id);

    return { deleted };
  }
}
