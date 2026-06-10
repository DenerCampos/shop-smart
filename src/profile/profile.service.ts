import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { FILE_STORAGE } from 'src/file-storage/file-storage.constants';
import { IFileStorageService } from 'src/file-storage/interfaces/file-storage.interface';
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
import { buildInstallmentLabel } from 'src/common/installment/installment.util';
import { registrarionsType } from './types/profileType';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { AuthService, IntegrationStatus } from 'src/auth/auth.service';
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
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorageService,
    private readonly familyMemberResolver: FamilyMemberResolverService,
    private readonly authService: AuthService,
  ) {}

  async getProfile(user: User): Promise<ProfileModel> {
    const revenues = await this.revenueService.getRevenueByCurrentMonth(user);
    const expenses = await this.expenseService.getExpenseByCurrentMonth(user);
    const coins = await this.coinService.getCoinsByUser(user);
    const hasRecurringRevenues =
      await this.revenueService.hasRecurringPreviousMonth(user);
    const hasRecurringExpenses =
      await this.expenseService.hasRecurringPreviousMonth(user);

    const isFirstAccess = !user.family;

    return new ProfileModel({
      user,
      income: revenues.value,
      expenses: expenses.value,
      coins: coins,
      isFirstAccess,
      hasRecurringRevenues: hasRecurringRevenues,
      hasRecurringExpenses: hasRecurringExpenses,
    });
  }

  async completeProfile(
    user: User,
    completeProfileDto: CompleteProfileDto,
  ): Promise<void> {
    const hasIncomeData =
      completeProfileDto.income !== undefined &&
      completeProfileDto.income !== null;

    if (hasIncomeData) {
      const revenue = await this.revenueService.create(user, {
        name: completeProfileDto.name as string,
        value: completeProfileDto.income,
        repeat: completeProfileDto.repeatMonthly ?? false,
        date: new Date(completeProfileDto.date as string),
      });

      if (!revenue) {
        throw new NotFoundException('Revenue not found');
      }
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
      const oldFileId = this.fileStorage.extractFileIdFromUrl(
        user.profileImage,
      );
      if (oldFileId) {
        await this.fileStorage.deleteFile(oldFileId);
      }
    }

    const fileName = `profile_${user.id}_${uuidv4()}${this.getExtension(file.originalname)}`;

    const uploadResult = await this.fileStorage.uploadFile(
      file.buffer,
      fileName,
      file.mimetype,
      'profile',
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

    const { userIds } = await this.familyMemberResolver.resolve(user.id);

    const [expensesLatest, revenuesLatest, totalExpenses, totalRevenues] =
      await Promise.all([
        this.expenseService.getLatest(userIds, fetchLimit),
        this.revenueService.getLatest(userIds, fetchLimit),
        this.expenseService.countByUser(userIds),
        this.revenueService.countByUser(userIds),
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
      const isInstallment = registration.isInstallment ?? false;
      const installmentNumber = registration.installmentNumber ?? null;
      const totalInstallments = registration.totalInstallments ?? null;
      return new RegistrationModel({
        id: registration.id as string,
        name: registration.name,
        value: registration.value,
        coins: registration.type === 'revenue' ? 10 : 5,
        type: registration.type,
        date: registration.createdAt,
        user: registration.user,
        isInstallment,
        installmentNumber,
        totalInstallments,
        installmentLabel: buildInstallmentLabel(
          installmentNumber,
          totalInstallments,
        ),
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

  async getIntegrations(
    userId: string,
  ): Promise<Record<string, IntegrationStatus>> {
    return this.authService.getIntegrations(userId);
  }

  async unlinkAlexa(userId: string): Promise<{ unlinked: boolean }> {
    return this.authService.unlinkIntegration(userId, 'alexa');
  }
}
