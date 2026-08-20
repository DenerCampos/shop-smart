import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Equal, Not, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateException } from 'src/exception/updateException';
import { RemoveException } from 'src/exception/removeException';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private userEntity: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userEntity.create(createUserDto);
    return await this.userEntity.save(newUser);
  }

  async countAll(): Promise<number> {
    return await this.userEntity.count({
      withDeleted: false,
    });
  }

  async find(id: string): Promise<User | null> {
    return await this.userEntity.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userEntity.findOneBy({ email });
  }

  async findByEmailWithDeleted(email: string): Promise<User | null> {
    return await this.userEntity.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  async searchByEmailPrefix(
    emailPrefix: string,
    limit: number,
  ): Promise<User[]> {
    return await this.userEntity
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email'])
      .where('LOWER(user.email) LIKE :prefix', {
        prefix: `${emailPrefix.toLowerCase()}%`,
      })
      .andWhere('user.deletedAt IS NULL')
      .orderBy('user.email', 'ASC')
      .take(limit)
      .getMany();
  }

  async saveToken(id: string, token: string): Promise<User> {
    const updateUser = await this.userEntity.findOneBy({ id });

    if (!updateUser) {
      throw new UpdateException();
    }

    const user = await this.userEntity.save({
      ...updateUser,
      token,
    });

    return user;
  }

  async clearAuthTokens(id: string): Promise<void> {
    await this.userEntity.update({ id }, { token: null, refreshtoken: null });
  }

  async exist(email: string, user: User): Promise<boolean> {
    if (!email) {
      return false;
    }

    const existUser = await this.userEntity.findOne({
      where: {
        email,
        id: Not(Equal(user.id)),
      },
      withDeleted: true,
    });

    return existUser ? true : false;
  }

  async update(user: User, updateUserDto: UpdateUserDto): Promise<User> {
    return await this.userEntity.save({
      ...user,
      ...updateUserDto,
    });
  }

  async remove(id: string): Promise<User> {
    const user = await this.userEntity.findOneBy({ id });

    if (user) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.userEntity.remove(user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }

  async restore(id: string): Promise<boolean> {
    const result = await this.userEntity.restore({ id });
    return result.affected === 1;
  }

  async saveRefreshToken(id: string, token: string): Promise<User> {
    const user = await this.userEntity.findOneBy({ id });

    if (!user) {
      throw new UpdateException();
    }

    return await this.userEntity.save({ ...user, refreshtoken: token });
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    return await this.userEntity.findOne({
      where: { refreshtoken: token },
    });
  }
}
