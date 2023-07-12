import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserModel } from './model/user.model';
import { AppConfig } from './../config/app.config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private saltOrRounds: number;

  constructor(
    private userRepository: UserRepository,
    private appConfig: AppConfig,
  ) {
    this.saltOrRounds = this.appConfig.getSaltEncryption();
  }

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const hash = await bcrypt.hash(createUserDto.password, this.saltOrRounds);
    createUserDto.password = hash;

    return this.userRepository.create(createUserDto);
  }

  async findAll(): Promise<UserModel[] | []> {
    return this.userRepository.findAll();
  }

  async find(userId: string): Promise<UserModel | null> {
    return this.userRepository.find(userId);
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
}
