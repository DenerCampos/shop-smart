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
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { RegistrationModel } from './models/registration.models';
import { Expense } from 'src/expense/entities/expense.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';
import { registrarionsType } from './types/profileType';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async getProfile(user: User): Promise<ProfileModel> {
    const revenues = await this.revenueService.getRevenueByCurrentMonth(user);
    const expenses = await this.expenseService.getExpenseByCurrentMonth(user);
    const coins = await this.coinService.getCoinsByUser(user);
    const existRevenue = await this.revenueService.exist(user);
    const hasRecurringRevenues =
      await this.revenueService.hasRecurringPreviousMonth(user);
    const hasRecurringExpenses =
      await this.expenseService.hasRecurringPreviousMonth(user);

    return new ProfileModel({
      user,
      income: revenues.value,
      expenses: expenses.value,
      coins: coins,
      isFirstAccess: !existRevenue,
      hasRecurringRevenues: hasRecurringRevenues,
      hasRecurringExpenses: hasRecurringExpenses,
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
      date: new Date(completeProfileDto.date),
    });

    if (!revenue) {
      throw new NotFoundException('Revenue not found');
    }

    await this.userService.update(user.id, {
      family: completeProfileDto.family,
    });

    return;
  }

  async uploadProfileImage(
    user: User,
    file: Express.Multer.File,
  ): Promise<User> {
    if (user.profileImage) {
      const oldFileId = this.googleDriveService.extractFileIdFromUrl(
        user.profileImage,
      );
      if (oldFileId) {
        await this.googleDriveService.deleteFile(oldFileId);
      }
    }

    const fileName = `profile_${user.id}_${uuidv4()}${this.getExtension(file.originalname)}`;

    const uploadResult = await this.googleDriveService.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
    );

    return await this.userService.update(user.id, {
      profileImage: uploadResult.webContentLink,
    });
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '.jpg';
  }

  async getLatestRegistrations(
    user: User,
    page: number,
    limit: number,
  ): Promise<paginationData<RegistrationModel>> {
    const fetchLimit = page * limit;

    const [expensesLatest, revenuesLatest, totalExpenses, totalRevenues] =
      await Promise.all([
        this.expenseService.getLatest(user, fetchLimit),
        this.revenueService.getLatest(user, fetchLimit),
        this.expenseService.countByUser(user.id),
        this.revenueService.countByUser(user.id),
      ]);

    const totalItems = totalExpenses + totalRevenues;

    const expensesWithType = expensesLatest.map((expense: Expense) => ({
      ...expense,
      type: 'expense' as registrarionsType,
    }));

    const revenuesWithType = revenuesLatest.map((revenue: Revenue) => ({
      ...revenue,
      type: 'revenue' as registrarionsType,
    }));

    const allRegistrations = [...expensesWithType, ...revenuesWithType]
      .filter((registration) => registration.createdAt)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    const offset = (page - 1) * limit;
    const pageRegistrations = allRegistrations.slice(offset, offset + limit);

    const registrations = pageRegistrations.map((registration) => {
      return new RegistrationModel({
        id: registration.id as string,
        name: registration.name,
        value: registration.value,
        coins: registration.type === 'revenue' ? 10 : 5,
        type: registration.type,
        date: registration.createdAt,
      });
    });

    return this.pagination.paginateData<RegistrationModel>(
      registrations,
      page,
      limit,
      totalItems,
      `${this.url}/latest-registrations`,
    );
  }
}
