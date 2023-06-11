import { Injectable } from '@nestjs/common';
import { GroupRepository } from './group.repository';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupModel } from './model/group.model';

@Injectable()
export class GroupService {
  constructor(private groupRepository: GroupRepository) {}

  async create(createGroupDto: CreateGroupDto): Promise<GroupModel> {
    const { id, name } = await this.groupRepository.create(createGroupDto);
    return new GroupModel({ id, name });
  }

  async findAll(): Promise<GroupModel[]> {
    const groups = await this.groupRepository.findAll();
    return groups.map(({ id, name }) => new GroupModel({ id, name }));
  }

  async find(groupId: number): Promise<GroupModel> {
    const { id, name } = await this.groupRepository.find(groupId);
    return new GroupModel({ id, name });
  }

  async update(
    groupId: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupModel> {
    const { id, name } = await this.groupRepository.update(
      groupId,
      updateGroupDto,
    );
    return new GroupModel({ id, name });
  }

  async remove(groupId: number): Promise<GroupModel> {
    const { id, name } = await this.groupRepository.remove(groupId);
    return new GroupModel({ id, name });
  }
}
