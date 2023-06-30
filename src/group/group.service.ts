import { Injectable } from '@nestjs/common';
import { GroupRepository } from './group.repository';
import { CreateGroupDto } from './dto/createGroup.dto';
import { UpdateGroupDto } from './dto/updateGroup.dto';
import { GroupModel } from './model/group.model';

@Injectable()
export class GroupService {
  constructor(private groupRepository: GroupRepository) {}

  async create(createGroupDto: CreateGroupDto): Promise<GroupModel> {
    return this.groupRepository.create(createGroupDto);
  }

  async findAll(): Promise<GroupModel[] | []> {
    return this.groupRepository.findAll();
  }

  async find(groupId: number): Promise<GroupModel | null> {
    return this.groupRepository.find(groupId);
  }

  async update(
    groupId: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupModel> {
    return this.groupRepository.update(groupId, updateGroupDto);
  }

  async remove(groupId: number): Promise<GroupModel> {
    return this.groupRepository.remove(groupId);
  }

  async delete(groupId: number): Promise<boolean> {
    return this.groupRepository.delete(groupId);
  }
}
