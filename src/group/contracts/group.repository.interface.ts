import { Group } from '../entities/group.entity';

export interface IGroupRepository {
  create(newGroup: Group): Promise<Group>;
  findAll(): Promise<Group[]>;
  find(id: number): Promise<Group>;
  update(id: number, updateGroup: Group): Promise<Group>;
  remove(id: number): Promise<Group>;
  delete(id: number): Promise<boolean>;
}
