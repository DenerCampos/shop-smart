import { EntityManager } from 'typeorm';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { Group } from '../entities/group.entity';
import { User } from 'src/user/entities/user.entity';

export interface IGroupRepository {
  create(
    createGroupDto: CreateGroupDto,
    user: User,
    manager?: EntityManager,
  ): Promise<Group>;
  findAll(
    user: User,
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Group[], number]>;
  find(id: string): Promise<Group | null>;
  findByIdAndUser(id: string, user: User): Promise<Group | null>;
  update(
    group: Group,
    updateGroup: UpdateGroupDto,
    manager?: EntityManager,
  ): Promise<Group>;
  remove(id: string): Promise<Group>;
  delete(id: string): Promise<boolean>;
  findByItemIdOrName(id: string, name: string): Promise<Group | null>;
  countAll(): Promise<number>;
  exist(name: string, group: Group): Promise<boolean>;
  findByName(name: string, user: User): Promise<Group | null>;
  findAllNames(user?: User): Promise<string[]>;
}
