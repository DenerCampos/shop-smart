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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ProfileDto } from './dto/profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { GetLatestDto } from './dto/get-latest.dto';
import { registration } from './types/userType';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
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
  @Get('profile')
  async profile(@CurrentUser() user: User): Promise<ProfileDto> {
    return await this.userService.getProfile(user);
  }

  @UseGuards(AuthGuard)
  @Post('complete-profile')
  async completeProfile(
    @CurrentUser() user: User,
    @Body() completeUserDto: CompleteProfileDto,
  ): Promise<void> {
    return await this.userService.completeProfile(user, completeUserDto);
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
  @Get('/latest-registrations')
  async getLatestRegistrations(
    @Query() query: GetLatestDto,
    @CurrentUser() user: User,
  ): Promise<registration[] | []> {
    return await this.userService.getLatestRegistrations(user, query.limit);
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
