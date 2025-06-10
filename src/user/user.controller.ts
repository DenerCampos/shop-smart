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
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { UserModel } from './model/user.model';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ProfileDto } from './dto/profile.dto';
import { CompleteProfileDto } from './dto/completeProfile.dto';
import { GetLatestDto } from './dto/getLatest.dto';
import { registration } from './types/userType';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserModel> {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: UserModel): Promise<ProfileDto> {
    return this.userService.getProfile(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('complete-profile')
  completeProfile(
    @CurrentUser() user: UserModel,
    @Body() completeUserDto: CompleteProfileDto,
  ): Promise<void> {
    return this.userService.completeProfile(user, completeUserDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<UserModel[]> {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('/latest-registrations')
  async getLatestRegistrations(
    @Query() query: GetLatestDto,
    @CurrentUser() user: UserModel,
  ): Promise<registration[] | []> {
    return this.userService.getLatestRegistrations(user, query.limit);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserModel> {
    return this.userService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserModel> {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.userService.delete(id);

    return { deleted };
  }
}
