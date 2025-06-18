import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
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
    const user = await this.userEntity.findOne({
      where: {
        email: ILike(`%${createUserDto.email}%`),
      },
    });

    if (user) {
      throw new AlreadyExistsException();
    }

    const newUser = this.userEntity.create(createUserDto);

    return await this.userEntity.save(newUser);
  }

  async findAll(page: number, limit: number): Promise<[User[], number]> {
    const queryBuilder = this.userEntity.createQueryBuilder('user');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateUser = await this.userEntity.findOneBy({ id });

    if (!updateUser) {
      throw new UpdateException();
    }

    const existUser = await this.userEntity.findOne({
      where: {
        email: ILike(`%${updateUserDto.email}%`),
        id: Not(Equal(updateUser.id)),
      },
    });

    if (existUser) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new AlreadyExistsException();
    }

    const user = await this.userEntity.save({
      ...updateUser,
      ...updateUserDto,
    });

    return user;
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
}
