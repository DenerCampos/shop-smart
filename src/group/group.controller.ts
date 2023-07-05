import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { UpdateGroupDto } from './dto/updateGroup.dto';
import { CreateGroupDto } from './dto/createGroup.dto';
import { GroupModel } from './model/group.model';

@Controller('/group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() createStoreDto: CreateGroupDto): Promise<GroupModel> {
    return this.groupService.create(createStoreDto);
  }

  @Get()
  findAll(): Promise<GroupModel[]> {
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<GroupModel> {
    return this.groupService.find(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateGroupDto,
  ): Promise<GroupModel> {
    return this.groupService.update(id, updateStoreDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.groupService.delete(id);

    return { deleted };
  }
}
