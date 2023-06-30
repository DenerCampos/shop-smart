import { CreateGroupDto } from '../dto/createGroup.dto';
import { UpdateGroupDto } from '../dto/updateGroup.dto';
import { GroupModel } from '../model/group.model';

export interface IGroupRepository {
  create(newGroup: CreateGroupDto): Promise<GroupModel>;
  findAll(): Promise<GroupModel[] | []>;
  find(id: number): Promise<GroupModel | null>;
  update(id: number, updateGroup: UpdateGroupDto): Promise<GroupModel>;
  remove(id: number): Promise<GroupModel>;
  delete(id: number): Promise<boolean>;
}
