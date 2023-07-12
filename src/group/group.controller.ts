import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { UpdateGroupDto } from './dto/updateGroup.dto';
import { CreateGroupDto } from './dto/createGroup.dto';
import { GroupModel } from './model/group.model';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createStoreDto: CreateGroupDto): Promise<GroupModel> {
    return this.groupService.create(createStoreDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<GroupModel[]> {
    return this.groupService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<GroupModel> {
    return this.groupService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateGroupDto,
  ): Promise<GroupModel> {
    return this.groupService.update(id, updateStoreDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.groupService.delete(id);

    return { deleted };
  }
}
