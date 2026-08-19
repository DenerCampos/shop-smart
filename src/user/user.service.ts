import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { QueryFailedError } from 'typeorm';
import { EVENT_EMITTER } from '../common/event-emitter/event-emitter.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppConfig } from '../common/app-config/app.config';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './interfaces/user.repository.interface';
import { User } from './entities/user.entity';
import { UpdateException } from 'src/exception/updateException';
import {
  AccountDeletedReactivationRequiredException,
  EmailAlreadyExistsException,
  UserLimitReachedException,
} from 'src/exception/authErrorException';
import { NotExistException } from 'src/exception/notExistException';
import { UserCreatedEvent } from './events/user-created.event';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';

@Injectable()
export class UserService {
  private readonly saltOrRounds: number;
  private readonly limitUsers: number = 15;
  private readonly searchLimit = 10;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly appConfig: AppConfig,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
    private readonly familyMemberResolver: FamilyMemberResolverService,
  ) {
    this.saltOrRounds = this.appConfig.getSaltEncryption();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const totalUsers = await this.userRepository.countAll();

    if (totalUsers >= this.limitUsers) {
      throw new UserLimitReachedException();
    }

    const existing = await this.userRepository.findByEmailWithDeleted(
      createUserDto.email,
    );

    if (existing) {
      if (existing.deletedAt) {
        throw new AccountDeletedReactivationRequiredException();
      }
      throw new EmailAlreadyExistsException();
    }

    const hash = await bcrypt.hash(createUserDto.password, this.saltOrRounds);
    createUserDto.password = hash;

    // `family` vazio até complete-profile; alinha com `isFirstAccess` no perfil (não usar nome como família).
    if (createUserDto.family === undefined) {
      createUserDto.family = '';
    }

    if (createUserDto.coatOfArms === undefined) {
      createUserDto.coatOfArms = '/assets/images/brasao/brasao-1.png';
    }

    try {
      const user = await this.userRepository.create(createUserDto);

      this.eventEmitter.emit('user.created', new UserCreatedEvent(user));

      return user;
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new EmailAlreadyExistsException();
      }
      throw error;
    }
  }

  async findAndValidateOwnership(
    userId: string,
    currentUserId: string,
  ): Promise<User> {
    if (userId !== currentUserId) {
      throw new ForbiddenException();
    }

    const user = await this.userRepository.find(userId);

    if (!user) {
      throw new NotExistException();
    }

    return user;
  }

  async find(userId: string): Promise<User | null> {
    return await this.userRepository.find(userId);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async findByEmailWithDeleted(email: string): Promise<User | null> {
    return await this.userRepository.findByEmailWithDeleted(email);
  }

  async searchByEmail(
    requestingUserId: string,
    emailPrefix: string,
  ): Promise<Pick<User, 'id' | 'name' | 'email'>[]> {
    const isAdmin =
      await this.familyMemberResolver.isAdminOfAnyGroup(requestingUserId);

    if (!isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores de grupo familiar podem buscar usuários.',
      );
    }

    return this.userRepository.searchByEmailPrefix(
      emailPrefix,
      this.searchLimit,
    );
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

    if (updateUserDto.email) {
      const existUser = await this.userRepository.exist(
        updateUserDto.email,
        updateUser,
      );

      if (existUser) {
        throw new EmailAlreadyExistsException();
      }
    }

    try {
      return await this.userRepository.update(updateUser, updateUserDto);
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new EmailAlreadyExistsException();
      }
      throw error;
    }
  }

  async delete(userId: string): Promise<boolean> {
    return this.userRepository.delete(userId);
  }

  async restore(userId: string): Promise<boolean> {
    return this.userRepository.restore(userId);
  }

  async countActiveUsers(): Promise<number> {
    return this.userRepository.countAll();
  }

  getUserLimit(): number {
    return this.limitUsers;
  }

  async saveRefreshToken(id: string, token: string): Promise<User> {
    return this.userRepository.saveRefreshToken(id, token);
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    return this.userRepository.findByRefreshToken(token);
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as
      | { errno?: number; code?: string }
      | undefined;

    return driverError?.errno === 1062 || driverError?.code === 'ER_DUP_ENTRY';
  }
}
