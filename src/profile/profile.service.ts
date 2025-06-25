import { Injectable, NotFoundException } from '@nestjs/common';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { User } from 'src/user/entities/user.entity';
import { ProfileModel } from './models/profile.models';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UserService } from 'src/user/user.service';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { CoinService } from 'src/coin/coin.service';
import { RegistrationModel } from './models/registration.models';
import { Expense } from 'src/expense/entities/expense.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';
import { registrarionsType } from './types/profileType';

@Injectable()
export class ProfileService {
  private url = `${this.appConfig.getBaseUrl()}/profile`;

  constructor(
    private appConfig: AppConfig,
    private pagination: Pagination,
    private readonly userService: UserService,
    private readonly expenseService: ExpenseService,
    private readonly revenueService: RevenueService,
    private readonly coinService: CoinService,
  ) {}

  async getProfile(user: User): Promise<ProfileModel> {
    const revenues = await this.revenueService.getRevenueByCurrentMonth(user);
    const expenses = await this.expenseService.getExpenseByCurrentMonth(user);
    const coins = await this.coinService.getCoinsByUser(user);
    const existRevenue = await this.revenueService.exist();
    const newMonth = await this.revenueService.isUserNewMonth(user);

    return new ProfileModel({
      user,
      income: revenues.value,
      expenses: expenses.value,
      coins: coins,
      isFirstAccess: !existRevenue,
      newMonth: newMonth,
    });
  }

  async completeProfile(
    user: User,
    completeProfileDto: CompleteProfileDto,
  ): Promise<void> {
    const revenue = await this.revenueService.create(user, {
      name: completeProfileDto.name,
      value: completeProfileDto.income,
      repeat: completeProfileDto.repeatMonthly,
    });

    if (!revenue) {
      throw new NotFoundException('Revenue not found');
    }

    await this.userService.update(user.id, {
      family: completeProfileDto.family,
    });

    return;
  }

  async getLatestRegistrations(
    user: User,
    limit: number,
  ): Promise<paginationData<RegistrationModel>> {
    const expenses = this.expenseService.getLatest(user, limit);
    const revenues = this.revenueService.getLatest(user, limit);

    const [expensesLatest, revenuesLatest] = await Promise.all([
      expenses,
      revenues,
    ]);

    // Adiciona o type antes de unir
    const expensesWithType = expensesLatest.map((expense: Expense) => ({
      ...expense,
      type: 'expense' as registrarionsType,
    }));

    const revenuesWithType = revenuesLatest.map((revenue: Revenue) => ({
      ...revenue,
      type: 'revenue' as registrarionsType,
    }));

    const allRegistrations = [...expensesWithType, ...revenuesWithType];

    const latestRegistrations = allRegistrations
      .filter((registration) => registration.createdAt) // Remove registros sem data
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    const registrarions = latestRegistrations.map((registration) => {
      return new RegistrationModel({
        id: registration.id as string,
        name: registration.name,
        value: registration.value,
        coins: 5, // TODO: Implementar coins
        type: registration.type,
        date: registration.createdAt,
      });
    });

    const paginateData = this.pagination.paginateData<RegistrationModel>(
      registrarions,
      1,
      limit,
      registrarions.length,
      this.url,
    );

    return paginateData;
  }
}
