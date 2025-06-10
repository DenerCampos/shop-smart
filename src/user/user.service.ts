import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserModel } from './model/user.model';
import { AppConfig } from '../common/app-config/app.config';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './contracts/user.repository.interface';
import { ProfileDto } from './dto/profile.dto';
import { ExpenseService } from 'src/expense/expense.service';
import { CoinService } from 'src/coin/coin.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { CompleteProfileDto } from './dto/completeProfile.dto';
import { registration } from './types/userType';
import { ExpenseModel } from 'src/expense/model/expense.model';
import { RevenueModel } from 'src/revenue/model/revenue.model';

@Injectable()
export class UserService {
  private saltOrRounds: number;

  constructor(
    private userRepository: IUserRepository,
    private appConfig: AppConfig,
    private expenseService: ExpenseService,
    private revenueService: RevenueService,
    private coinService: CoinService,
  ) {
    this.saltOrRounds = this.appConfig.getSaltEncryption();
  }

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const hash = await bcrypt.hash(createUserDto.password, this.saltOrRounds);
    createUserDto.password = hash;

    if (createUserDto.family === undefined) {
      createUserDto.family = createUserDto.name;
    }

    if (createUserDto.coatOfArms === undefined) {
      createUserDto.coatOfArms = '/assets/images/coat_of_arms_solare.png';
    }

    return this.userRepository.create(createUserDto);
  }

  async findAll(): Promise<UserModel[] | []> {
    return this.userRepository.findAll();
  }

  async find(userId: string): Promise<UserModel | null> {
    return this.userRepository.find(userId);
  }

  async findByEmail(email: string): Promise<UserModel | undefined> {
    return this.userRepository.findByEmail(email);
  }

  async saveToken(id: string, token: string): Promise<UserModel | undefined> {
    return this.userRepository.saveToken(id, token);
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserModel> {
    if (updateUserDto.password) {
      const hash = await bcrypt.hash(updateUserDto.password, this.saltOrRounds);
      updateUserDto.password = hash;
    }

    return this.userRepository.update(userId, updateUserDto);
  }

  async delete(userId: string): Promise<boolean> {
    return this.userRepository.delete(userId);
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userRepository.find(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const revenues = await this.revenueService.getRevenueByCurrentMonth(user);
    const expenses = await this.expenseService.getExpenseByCurrentMonth(user);
    const coins = await this.coinService.getCoinsByUser(user);
    const existRevenue = await this.revenueService.exist();
    const newMonth = await this.revenueService.isUserNewMonth(user);

    return new ProfileDto({
      ...user,
      income: revenues.value,
      expenses: expenses.value,
      coins: coins,
      isFirstAccess: !existRevenue,
      newMonth: newMonth,
    });
  }

  async completeProfile(
    user: UserModel,
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

    await this.userRepository.update(user.id, {
      family: completeProfileDto.family,
    });

    return;
  }

  async getLatestRegistrations(
    user: UserModel,
    limit: number,
  ): Promise<registration[] | []> {
    const expenses = this.expenseService.getLatest(user, limit);
    const revenues = this.revenueService.getLatest(user, limit);

    const [expensesLatest, revenuesLatest] = await Promise.all([
      expenses,
      revenues,
    ]);

    // Adiciona o type antes de unir
    const expensesWithType = expensesLatest.map((expense: ExpenseModel) => ({
      ...expense,
      type: 'expense',
    }));

    const revenuesWithType = revenuesLatest.map((revenue: RevenueModel) => ({
      ...revenue,
      type: 'revenue',
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

    return latestRegistrations.map((registration) => {
      return {
        id: registration.id as string,
        name: registration.name,
        value: registration.value,
        coins: 5, // TODO: Implementar coins
        type: registration.type,
        date: registration.createdAt,
      };
    });
  }
}
