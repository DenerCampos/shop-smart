import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ProfileService } from './profile.service';
import { ResponseService } from 'src/common/response/response';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { GetLatestRegistrarionsDto } from './dto/get-latest-registrarions.dto';
import { LatestRegistrationsDto } from './dto/latest-registrations.dto';

@Controller('/profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('complete-profile')
  async completeProfile(
    @CurrentUser() user: User,
    @Body() completeUserDto: CompleteProfileDto,
  ): Promise<void> {
    return await this.profileService.completeProfile(user, completeUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('')
  async profile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    const profile = await this.profileService.getProfile(user);

    return this.responseService.mapToDto(ProfileResponseDto, profile);
  }

  @UseGuards(AuthGuard)
  @Get('/latest-registrations')
  async getLatestRegistrations(
    @Query() query: GetLatestRegistrarionsDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<LatestRegistrationsDto>> {
    const latestRegistrations =
      await this.profileService.getLatestRegistrations(user, query.limit);

    return this.responseService.mapPaginatedToDto(
      LatestRegistrationsDto,
      latestRegistrations,
    );
  }
}
