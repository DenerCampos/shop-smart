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

    return new ProfileDto({
      ...user,
      income: revenues.value,
      expenses: expenses.value,
      coins: coins,
      isFirstAccess: revenues.value.toString() === '0.00',
    });
  }
}
