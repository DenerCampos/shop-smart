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
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { ResponseService } from 'src/common/response/response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

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
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findAndValidateOwnership(id, currentUser.id);

    return this.responseService.mapToDto(UserResponseDto, user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    await this.userService.findAndValidateOwnership(id, currentUser.id);

    const user = await this.userService.update(id, updateUserDto);

    return this.responseService.mapToDto(UserResponseDto, user);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<object> {
    await this.userService.findAndValidateOwnership(id, currentUser.id);

    const deleted = await this.userService.delete(id);

    return { deleted };
  }
}
