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
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { ResponseService } from 'src/common/response/response';
import { UserListDto } from './dto/user-list.dto';
import { paginationData } from 'src/common/pagination/pagination';

@Controller('/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const createUser = await this.userService.create(createUserDto);

    return this.responseService.mapToDto(UserResponseDto, createUser);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: UserListDto,
  ): Promise<paginationData<UserResponseDto>> {
    const users = await this.userService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(UserResponseDto, users);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.find(id);

    return this.responseService.mapToDto(UserResponseDto, user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(id, updateUserDto);

    return this.responseService.mapToDto(UserResponseDto, user);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.userService.delete(id);

    return { deleted };
  }
}
