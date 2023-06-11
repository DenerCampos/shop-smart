import { Injectable } from '@nestjs/common';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { IGroupRepository } from './contracts/group.repository.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(private groupEntity: Repository<Group>) {}
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = this.groupEntity.create(createGroupDto);

    return this.groupEntity.save(group);
  }
  async findAll(): Promise<Group[]> {
    return this.groupEntity.find();
  }
  async find(id: number): Promise<Group> {
    return this.groupEntity.findOneBy({ id });
  }
  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupEntity.findOneBy({ id });

    return this.groupEntity.save({ ...group, ...updateGroupDto });
  }
  async remove(id: number): Promise<Group> {
    const group = await this.groupEntity.findOneBy({ id });

    return this.groupEntity.remove(group);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.groupEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
