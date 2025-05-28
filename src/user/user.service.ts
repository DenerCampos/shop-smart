import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserModel } from './model/user.model';
import { AppConfig } from '../common/app-config/app.config';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './contracts/user.repository.interface';
import { ProfileDto } from './dto/profile.dto';
import { coinsType, financialDataType } from './types/userType';

@Injectable()
export class UserService {
  private saltOrRounds: number;

  constructor(
    private userRepository: IUserRepository,
    private appConfig: AppConfig,
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

    return new ProfileDto({
      ...user,
      isFirstAccess: user.income.toString() === '0.00',
    });
  }

  async addCoins(userId: string, type: coinsType): Promise<void> {
    const user = await this.userRepository.find(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const coins = this.getValueCoinsByType(type);
    user.coins += coins;

    this.userRepository.update(user.id, user);
  }

  private getValueCoinsByType(type: coinsType): number {
    const types = {
      coupon: 5,
      group: 2,
      payment: 2,
      store: 2,
    };

    return types[type] || 0;
  }

  async addExpenses(userId: string, value: number): Promise<void> {
    if (isNaN(value) || value < 0) {
      throw new Error('Valor inválido para adicionar às despesas');
    }

    const user = await this.userRepository.find(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentExpenses = Number(user.expenses) || 0;
    const totalExpenses = Number(currentExpenses) + Number(value);

    user.expenses = Math.round(totalExpenses * 100) / 100;

    await this.userRepository.update(user.id, user);
  }

  async updateFinancialData(
    userId: string,
    data: financialDataType,
  ): Promise<void> {
    const results = await Promise.allSettled([
      this.addCoins(userId, data.typeCoins),
      this.addExpenses(userId, data.expenses),
    ]);

    results.forEach((result, index) => {
      const operation = index === 0 ? 'addCoins' : 'addExpenses';

      if (result.status === 'rejected') {
        console.error(`Erro em ${operation}:`, result);
      } else {
        // console.log(`Sucesso em ${operation}:`, result);
      }
    });
  }
}
