import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { ProfileService } from './profile.service';
import { ResponseService } from 'src/common/response/response';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { GetLatestRegistrationsDto } from './dto/get-latest-registrations.dto';
import { LatestRegistrationsDto } from './dto/latest-registrations.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { IntegrationsResponseDto } from './dto/integration-response.dto';

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
    @Query() query: GetLatestRegistrationsDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<LatestRegistrationsDto>> {
    const latestRegistrations =
      await this.profileService.getLatestRegistrations(
        user,
        query.page,
        query.limit,
      );

    return this.responseService.mapPaginatedToDto(
      LatestRegistrationsDto,
      latestRegistrations,
    );
  }

  @UseGuards(AuthGuard)
  @Get('integrations')
  async getIntegrations(
    @CurrentUser() user: User,
  ): Promise<IntegrationsResponseDto> {
    return this.profileService.getIntegrations(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('integrations/alexa/unlink')
  async unlinkAlexa(
    @CurrentUser() user: User,
  ): Promise<{ unlinked: boolean }> {
    return this.profileService.unlinkAlexa(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async uploadProfileImage(
    @CurrentUser() user: User,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<UserResponseDto> {
    if (!image) {
      throw new BadRequestException('Imagem é obrigatória');
    }
    const imageRegex = /^image\/(jpg|jpeg|png|gif|webp)$/;
    if (!imageRegex.test(image.mimetype)) {
      throw new BadRequestException(
        'Apenas imagens (jpg, jpeg, png, gif, webp) são permitidas',
      );
    }
    if (image.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Tamanho máximo permitido é 5MB');
    }

    const updatedUser = await this.profileService.uploadProfileImage(
      user,
      image,
    );

    return this.responseService.mapToDto(UserResponseDto, updatedUser);
  }
}
