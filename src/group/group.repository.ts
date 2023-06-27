import { Injectable } from '@nestjs/common';
import { Group } from './entities/group.entity';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { IGroupRepository } from './contracts/group.repository.interface';
import { CreateGroupDto } from './dto/createGroup.dto';
import { UpdateGroupDto } from './dto/updateGroup.dto';
import { GroupModel } from './model/group.model';
import { UpdateException } from 'src/Exception/updateException';
import { AlreadyExistsException } from 'src/Exception/alreadyExistsException copy';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(private groupEntity: Repository<Group>) {}

  async create(createGroupDto: CreateGroupDto): Promise<GroupModel> {
    const group = await this.groupEntity.findOne({
      where: {
        name: ILike(`%${createGroupDto.name}%`),
      },
    });

    if (group) {
      return new GroupModel(group);
    } else {
      const newGroup = this.groupEntity.create(createGroupDto);

      const savedStore = await this.groupEntity.save(newGroup);
      return new GroupModel(savedStore);
    }
  }
  async findAll(): Promise<GroupModel[]> {
    const groups = await this.groupEntity.find();

    return groups.map(({ id, name }) => new GroupModel({ id, name }));
  }
  async find(id: number): Promise<GroupModel> {
    const group = await this.groupEntity.findOneBy({ id });

    return new GroupModel(group);
  }
  async update(
    id: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupModel> {
    const updateGroup = await this.groupEntity.findOneBy({ id });

    if (!updateGroup) {
      throw new UpdateException();
    }

    const existGroup = await this.groupEntity.findOne({
      where: {
        name: ILike(`%${updateGroupDto.name}%`),
        id: Not(Equal(updateGroup.id)),
      },
    });

    if (existGroup) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new AlreadyExistsException();
    }

    const store = await this.groupEntity.save({
      ...updateGroup,
      ...updateGroupDto,
    });

    return new GroupModel(store);
  }
  async remove(id: number): Promise<GroupModel> {
    const group = await this.groupEntity.findOneBy({ id });

    return this.groupEntity.remove(group);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.groupEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
