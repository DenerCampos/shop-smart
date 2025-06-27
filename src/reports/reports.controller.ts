import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ReportsService } from './reports.service';
import { ResponseService } from 'src/common/response/response';
import { ExpenseByGroupDto } from './dto/expense-by-group.dto';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ExpenseByGroupResponseDto } from './dto/expense-by-group-response.dto';
import { ExpenseByStoreDto } from './dto/expense-by-store.dto';
import { ExpenseByStoreResponseDto } from './dto/expense-by-store-response.dto';
import { ExpenseByDateDto } from './dto/expense-by-date.dto';
import { ExpenseByDateResponseDto } from './dto/expense-by-date-response.dto';
import { MostPurchasedItemsResponseDto } from './dto/most-purchased-items-response.dto';
import { MostPurchasedItemsDto } from './dto/most-purchased-items.dto';
import { ExpensesIncomeComparisonDto } from './dto/expenses-income-comparison.dto';
import { ExpensesIncomeComparisonResponseDto } from './dto/expenses-income-comparison-response.dto';

@Controller('/reports')
export class ReportsController {
  // Implementar métodos do controller
  constructor(
    private readonly reportsService: ReportsService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('expense-by-group')
  async expenseByGroup(
    @CurrentUser() user: User,
    @Query() expenseByGroup: ExpenseByGroupDto,
  ): Promise<ExpenseByGroupResponseDto> {
    const reports = await this.reportsService.expenseByGroup(
      user,
      expenseByGroup,
    );

    return this.responseService.mapToDto(ExpenseByGroupResponseDto, reports);
  }

  @UseGuards(AuthGuard)
  @Get('expense-by-store')
  async expenseByStore(
    @CurrentUser() user: User,
    @Query() expenseByStore: ExpenseByStoreDto,
  ): Promise<ExpenseByStoreResponseDto> {
    const reports = await this.reportsService.expenseByStore(
      user,
      expenseByStore,
    );

    return this.responseService.mapToDto(ExpenseByStoreResponseDto, reports);
  }

  @UseGuards(AuthGuard)
  @Get('expense-by-date')
  async expenseByDate(
    @CurrentUser() user: User,
    @Query() expenseByDate: ExpenseByDateDto,
  ): Promise<ExpenseByDateResponseDto> {
    const reports = await this.reportsService.expenseByDate(
      user,
      expenseByDate,
    );

    return this.responseService.mapToDto(ExpenseByDateResponseDto, reports);
  }

  @UseGuards(AuthGuard)
  @Get('most-purchased-items')
  async mostPurchasedItems(
    @CurrentUser() user: User,
    @Query() mostPurchasedItems: MostPurchasedItemsDto,
  ): Promise<MostPurchasedItemsResponseDto> {
    const reports = await this.reportsService.mostPurchasedItems(
      user,
      mostPurchasedItems,
    );

    return this.responseService.mapToDto(
      MostPurchasedItemsResponseDto,
      reports,
    );
  }

  @UseGuards(AuthGuard)
  @Get('expenses-income-comparison')
  async expensesIncomeComparison(
    @CurrentUser() user: User,
    @Query() xpensesIncomeComparison: ExpensesIncomeComparisonDto,
  ): Promise<ExpensesIncomeComparisonResponseDto> {
    const reports = await this.reportsService.expensesIncomeComparison(
      user,
      xpensesIncomeComparison,
    );

    return this.responseService.mapToDto(
      ExpensesIncomeComparisonResponseDto,
      reports,
    );
  }
}
