import { EntityManager } from 'typeorm';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { Group } from '../entities/group.entity';

export interface IGroupRepository {
  create(
    createGroupDto: CreateGroupDto,
    manager?: EntityManager,
  ): Promise<Group>;
  findAll(page: number, limit: number): Promise<[Group[], number]>;
  find(id: string): Promise<Group | null>;
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
  findByName(name: string): Promise<Group | null>;
}
