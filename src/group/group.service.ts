import { Inject, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { IGroupRepository } from './interfaces/group.repository.interface';
import { Group } from './entities/group.entity';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { GroupListDto } from './dto/group-list.dto';
import { EntityManager } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';

@Injectable()
export class GroupService {
  private url = `${this.appConfig.getBaseUrl()}/group`;

  constructor(
    @Inject('IGroupRepository')
    private groupRepository: IGroupRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(
    createGroupDto: CreateGroupDto,
    manager?: EntityManager,
  ): Promise<Group> {
    return this.groupRepository.create(createGroupDto, manager);
  }

  async findByName(name: string): Promise<Group | null> {
    return this.groupRepository.findByName(name);
  }

  async findAll(userList: GroupListDto): Promise<paginationData<Group>> {
    const offset = this.pagination.getOffset(userList.page, userList.limit);

    const [users, total] = await this.groupRepository.findAll(
      offset,
      userList.limit,
      userList.search,
    );

    const paginateData = this.pagination.paginateData<Group>(
      users,
      userList.page,
      userList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(groupId: string): Promise<Group | null> {
    return this.groupRepository.find(groupId);
  }

  async update(
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    manager?: EntityManager,
  ): Promise<Group> {
    const updateGroup = await this.groupRepository.find(groupId);

    if (!updateGroup) {
      throw new UpdateException();
    }

    const existStore = await this.groupRepository.exist(
      updateGroupDto.name,
      updateGroup,
    );

    if (existStore) {
      throw new AlreadyExistsException();
    }

    return this.groupRepository.update(updateGroup, updateGroupDto, manager);
  }

  async remove(groupId: string): Promise<Group> {
    return this.groupRepository.remove(groupId);
  }

  async delete(groupId: string): Promise<boolean> {
    return this.groupRepository.delete(groupId);
  }
}
