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
import { AuthGuard } from 'src/auth/auth.guard';
import { ThemeService } from './theme.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ResponseService } from 'src/common/response/response';
import { ThemeListDto } from './dto/theme-list.dto';
import { ThemeResponseDto } from './dto/theme-response.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('/theme')
export class ThemeController {
  constructor(
    private readonly themeService: ThemeService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-default-theme')
  async createDefaultTheme(@CurrentUser() user: User): Promise<void> {
    await this.themeService.createDefaultTheme(user);
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createThemeDto: CreateThemeDto,
  ): Promise<ThemeResponseDto> {
    const createTheme = await this.themeService.create(createThemeDto);

    return this.responseService.mapToDto(ThemeResponseDto, createTheme);
  }

  @UseGuards(AuthGuard)
  @Get('available')
  async availableThemes(
    @CurrentUser() user: User,
  ): Promise<ThemeResponseDto[]> {
    const themes = await this.themeService.availableThemes(user);

    return themes.map((theme) =>
      this.responseService.mapToDto(ThemeResponseDto, theme),
    );
  }

  @UseGuards(AuthGuard)
  @Get('active')
  async activeTheme(@CurrentUser() user: User): Promise<ThemeResponseDto> {
    const theme = await this.themeService.activeTheme(user);

    return this.responseService.mapToDto(ThemeResponseDto, theme);
  }

  @UseGuards(AuthGuard)
  @Get('allowed')
  async allowedThemes(@CurrentUser() user: User): Promise<ThemeResponseDto> {
    const theme = await this.themeService.allowedThemes(user);

    return this.responseService.mapToDto(ThemeResponseDto, theme);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: ThemeListDto,
  ): Promise<paginationData<ThemeResponseDto>> {
    const themes = await this.themeService.findAll(listDto);

    return this.responseService.mapPaginatedToDto(ThemeResponseDto, themes);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ThemeResponseDto> {
    const theme = await this.themeService.find(id);

    return this.responseService.mapToDto(ThemeResponseDto, theme);
  }

  @UseGuards(AuthGuard)
  @Patch('active/update/:id')
  async updateActiveTheme(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ThemeResponseDto> {
    const theme = await this.themeService.updateActiveTheme(user, id);

    return this.responseService.mapToDto(ThemeResponseDto, theme);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
  ): Promise<ThemeResponseDto> {
    const theme = await this.themeService.update(id, updateThemeDto);

    return this.responseService.mapToDto(ThemeResponseDto, theme);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.themeService.delete(id);

    return { deleted };
  }
}
