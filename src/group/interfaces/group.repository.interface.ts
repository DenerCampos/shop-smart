import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { Group } from '../entities/group.entity';

export interface IGroupRepository {
  create(newGroup: CreateGroupDto): Promise<Group>;
  findAll(page: number, limit: number): Promise<[Group[], number]>;
  find(id: string): Promise<Group | null>;
  update(id: string, updateGroup: UpdateGroupDto): Promise<Group>;
  remove(id: string): Promise<Group>;
  delete(id: string): Promise<boolean>;
  findByItemIdOrName(id: string, name: string): Promise<Group | null>;
  countAll(): Promise<number>;
}
