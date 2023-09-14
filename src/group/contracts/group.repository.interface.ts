import { CreateGroupDto } from '../dto/createGroup.dto';
import { UpdateGroupDto } from '../dto/updateGroup.dto';
import { GroupModel } from '../model/group.model';

export interface IGroupRepository {
  create(newGroup: CreateGroupDto): Promise<GroupModel>;
  findAll(): Promise<GroupModel[] | []>;
  find(id: string): Promise<GroupModel | null>;
  update(id: string, updateGroup: UpdateGroupDto): Promise<GroupModel>;
  remove(id: string): Promise<GroupModel>;
  delete(id: string): Promise<boolean>;
  findByItemIdOrName(id: string, name: string): Promise<GroupModel | null>;
}
