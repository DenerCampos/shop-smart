import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { IUserRepository } from './contracts/user.repository.interface';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserModel } from './model/user.model';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private userEntity: Repository<User>) {}

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const user = await this.userEntity.findOne({
      where: {
        email: ILike(`%${createUserDto.email}%`),
      },
    });

    if (user) {
      throw new AlreadyExistsException();
    }

    const newUser = this.userEntity.create(createUserDto);

    const savedUser = await this.userEntity.save(newUser);
    return new UserModel(savedUser);
  }

  async findAll(): Promise<UserModel[] | []> {
    const users = await this.userEntity.find();

    if (users) {
      return users.map((user) => new UserModel(user));
    }

    return [];
  }

  async find(id: string): Promise<UserModel | null> {
    const user = await this.userEntity.findOneBy({ id });

    if (user) {
      return new UserModel(user);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserModel> {
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

    return new UserModel(user);
  }

  async remove(id: string): Promise<UserModel> {
    const user = await this.userEntity.findOneBy({ id });

    if (user) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.userEntity.remove(user);
    return new UserModel(user);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
