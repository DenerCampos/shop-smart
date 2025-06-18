import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppConfig } from '../common/app-config/app.config';
import * as bcrypt from 'bcrypt';
import { ProfileDto } from './dto/profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { registration } from './types/userType';
import { IUserRepository } from './interfaces/user.repository.interface';
import { User } from './entities/user.entity';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { UserListDto } from './dto/user-list.dto';

@Injectable()
export class UserService {
  private saltOrRounds: number;
  private url = `${this.appConfig.getBaseUrl()}/user`;

  constructor(
    @Inject('IUserRepository')
    private userRepository: IUserRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {
    this.saltOrRounds = this.appConfig.getSaltEncryption();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hash = await bcrypt.hash(createUserDto.password, this.saltOrRounds);
    createUserDto.password = hash;

    if (createUserDto.family === undefined) {
      createUserDto.family = createUserDto.name;
    }

    if (createUserDto.coatOfArms === undefined) {
      createUserDto.coatOfArms = '/assets/images/coat_of_arms_solare.png';
    }

    return await this.userRepository.create(createUserDto);
  }

  async findAll(userList: UserListDto): Promise<paginationData<User>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [users, total] = await this.userRepository.findAll(
      offset,
      userList.limit,
    );

    const paginateData = this.pagination.paginateData<User>(
      users,
      userList.page,
      userList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(userId: string): Promise<User | null> {
    return await this.userRepository.find(userId);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async saveToken(id: string, token: string): Promise<User | null> {
    return this.userRepository.saveToken(id, token);
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      const hash = await bcrypt.hash(updateUserDto.password, this.saltOrRounds);
      updateUserDto.password = hash;
    }

    return await this.userRepository.update(userId, updateUserDto);
  }

  async delete(userId: string): Promise<boolean> {
    return this.userRepository.delete(userId);
  }

  async getProfile(user: User): Promise<ProfileDto> {
    // const revenues = await this.revenueService.getRevenueByCurrentMonth(user);
    // const expenses = await this.expenseService.getExpenseByCurrentMonth(user);
    // const coins = await this.coinService.getCoinsByUser(user);
    // const existRevenue = await this.revenueService.exist();
    // const newMonth = await this.revenueService.isUserNewMonth(user);

    return new ProfileDto({
      ...user,
      income: 10,
      expenses: 20,
      coins: 5,
      isFirstAccess: false,
      newMonth: false,
    });
  }

  async completeProfile(
    user: User,
    completeProfileDto: CompleteProfileDto,
  ): Promise<void> {
    //olhar
    // const revenue = await this.revenueService.create(user, {
    //   name: completeProfileDto.name,
    //   value: completeProfileDto.income,
    //   repeat: completeProfileDto.repeatMonthly,
    // });

    // if (!revenue) {
    //   throw new NotFoundException('Revenue not found');
    // }

    // await this.userRepository.update(user.id, {
    //   family: completeProfileDto.family,
    // });

    return;
  }

  async getLatestRegistrations(
    user: User,
    limit: number,
  ): Promise<registration[] | []> {
    //ohar
    // const expenses = this.expenseService.getLatest(user, limit);
    // const revenues = this.revenueService.getLatest(user, limit);

    // const [expensesLatest, revenuesLatest] = await Promise.all([
    //   expenses,
    //   revenues,
    // ]);

    // // Adiciona o type antes de unir
    // const expensesWithType = expensesLatest.map((expense: ExpenseModel) => ({
    //   ...expense,
    //   type: 'expense',
    // }));

    // const revenuesWithType = revenuesLatest.map((revenue: RevenueModel) => ({
    //   ...revenue,
    //   type: 'revenue',
    // }));

    // const allRegistrations = [...expensesWithType, ...revenuesWithType];

    // const latestRegistrations = allRegistrations
    //   .filter((registration) => registration.createdAt) // Remove registros sem data
    //   .sort((a, b) => {
    //     const dateA = new Date(a.createdAt);
    //     const dateB = new Date(b.createdAt);
    //     return dateB.getTime() - dateA.getTime();
    //   })
    //   .slice(0, limit);

    // return latestRegistrations.map((registration) => {
    //   return {
    //     id: registration.id as string,
    //     name: registration.name,
    //     value: registration.value,
    //     coins: 5, // TODO: Implementar coins
    //     type: registration.type,
    //     date: registration.createdAt,
    //   };
    // });

    return [
      {
        id: '1',
        name: 'registration.name',
        value: 10,
        coins: 5, // TODO: Implementar coins
        type: 'registration.type',
        date: new Date(),
      },
    ];
  }
}
