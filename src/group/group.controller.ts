import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ResponseService } from 'src/common/response/response';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupListDto } from './dto/group-list.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('/group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createStoreDto: CreateGroupDto,
    @CurrentUser() user: User,
  ): Promise<GroupResponseDto> {
    const createGroup = await this.groupService.create(createStoreDto, user);

    return this.responseService.mapToDto(GroupResponseDto, createGroup);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: GroupListDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<GroupResponseDto>> {
    const groups = await this.groupService.findAll(listDto, user);

    return this.responseService.mapPaginatedToDto(GroupResponseDto, groups);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupResponseDto> {
    const group = await this.groupService.find(id);

    return this.responseService.mapToDto(GroupResponseDto, group);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupService.update(id, updateStoreDto);

    return this.responseService.mapToDto(GroupResponseDto, group);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.groupService.delete(id);

    return { deleted };
  }
}
