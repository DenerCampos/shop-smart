import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from '../common/event-emitter/event-emitter.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppConfig } from '../common/app-config/app.config';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './interfaces/user.repository.interface';
import { User } from './entities/user.entity';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { UserListDto } from './dto/user-list.dto';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
export class UserService {
  private readonly saltOrRounds: number;
  private readonly url = `${this.appConfig.getBaseUrl()}/user`;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly appConfig: AppConfig,
    private readonly pagination: Pagination,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
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
      createUserDto.coatOfArms = '/assets/images/brasao/brasao-1.png';
    }

    const user = await this.userRepository.create(createUserDto);

    // Emite o evento de usuário criado
    this.eventEmitter.emit('user.created', new UserCreatedEvent(user));

    return user;
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

    const updateUser = await this.userRepository.find(userId);

    if (!updateUser) {
      throw new UpdateException();
    }

    const existUser = await this.userRepository.exist(
      updateUserDto.email,
      updateUser,
    );

    if (existUser) {
      throw new AlreadyExistsException();
    }

    return this.userRepository.update(updateUser, updateUserDto);
  }

  async delete(userId: string): Promise<boolean> {
    return this.userRepository.delete(userId);
  }
}
