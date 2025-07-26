import { Injectable } from '@nestjs/common';
import { EntityManager, Equal, ILike, Not, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { IGroupRepository } from '../interfaces/group.repository.interface';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateGroupDto } from '../dto/update-group.dto';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(
    @InjectRepository(Group)
    private groupEntity: Repository<Group>,
  ) {}

  async create(
    createGroupDto: CreateGroupDto,
    manager?: EntityManager,
  ): Promise<Group> {
    const repository = manager
      ? manager.getRepository(Group)
      : this.groupEntity;

    const existingGroup = await repository.findOne({
      where: {
        name: ILike(`%${createGroupDto.name}%`),
      },
    });

    if (existingGroup) {
      return existingGroup;
    }

    const group = repository.create(createGroupDto);
    return repository.save(group);
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Group[], number]> {
    const queryBuilder = this.groupEntity.createQueryBuilder('group');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    if (search) {
      queryBuilder.where('LOWER(group.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('group.createdAt', 'DESC');

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Group | null> {
    return await this.groupEntity.findOneBy({ id });
  }

  async update(
    group: Group,
    updateGroupDto: UpdateGroupDto,
    manager?: EntityManager,
  ): Promise<Group> {
    const repository = manager
      ? manager.getRepository(Group)
      : this.groupEntity;

    return await repository.save({
      ...group,
      ...updateGroupDto,
    });
  }

  async exist(name: string, group: Group): Promise<boolean> {
    const existGroup = await this.groupEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
        id: Not(Equal(group.id)),
      },
    });

    return existGroup ? true : false;
  }

  async findByName(name: string): Promise<Group | null> {
    return await this.groupEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
    });
  }

  async remove(id: string): Promise<Group> {
    const group = await this.groupEntity.findOneBy({ id });

    if (group) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.groupEntity.remove(group);
    return group;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.groupEntity.softDelete({ id });

    return result.affected === 1;
  }

  async findByItemIdOrName(id: string, name: string): Promise<Group | null> {
    return await this.groupEntity
      .createQueryBuilder('group')
      .innerJoin('group.items', 'item')
      .where('item.id = :id', { id })
      .orWhere('LOWER(item.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      })
      .orderBy('item.createdAt', 'DESC')
      .limit(1)
      .getOne();
  }

  async countAll(): Promise<number> {
    return await this.groupEntity.count({
      withDeleted: false,
    });
  }
}
