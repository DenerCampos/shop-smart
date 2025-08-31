import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter } from 'events';
import { UserCreatedEvent } from '../user/events/user-created.event';
import { IThemeRepository } from './interfaces/theme.repository.interface';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { ThemeListDto } from './dto/theme-list.dto';
import { EntityManager } from 'typeorm';
import { Theme } from './entities/theme.entity';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ThemeService {
  private url = `${this.appConfig.getBaseUrl()}/theme`;

  constructor(
    @Inject('IThemeRepository')
    private themeRepository: IThemeRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
    private eventEmitter: EventEmitter,
  ) {
    // Registra o listener para o evento user.created
    this.eventEmitter.on('user.created', this.handleUserCreated.bind(this));
  }

  async create(
    createThemeDto: CreateThemeDto,
    manager?: EntityManager,
  ): Promise<Theme> {
    return await this.themeRepository.create(createThemeDto, manager);
  }

  async findAll(themeList: ThemeListDto): Promise<paginationData<Theme>> {
    const offset = this.pagination.getOffset(themeList.page, themeList.limit);

    const [themes, total] = await this.themeRepository.findAll(
      offset,
      themeList.limit,
      themeList.search,
    );

    const paginateData = this.pagination.paginateData<Theme>(
      themes,
      themeList.page,
      themeList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(themeId: string): Promise<Theme | null> {
    return await this.themeRepository.find(themeId);
  }

  async update(
    themeId: string,
    updateThemeDto: UpdateThemeDto,
    manager?: EntityManager,
  ): Promise<Theme> {
    const updateTheme = await this.themeRepository.find(themeId);

    if (!updateTheme) {
      throw new UpdateException();
    }

    return this.themeRepository.update(updateTheme, updateThemeDto, manager);
  }

  async remove(themeId: string): Promise<Theme> {
    const theme = await this.themeRepository.find(themeId);

    if (!theme) {
      throw new RemoveException();
    }

    return await this.themeRepository.remove(theme);
  }

  async delete(themeId: string): Promise<boolean> {
    const theme = await this.themeRepository.find(themeId);

    if (!theme) {
      throw new RemoveException();
    }

    const deleted = await this.themeRepository.delete(theme);

    return !!deleted;
  }

  async availableThemes(
    user: User,
  ): Promise<(Theme & { isUnlocked: boolean })[]> {
    const [allThemes] = await this.themeRepository.findAll(0, 1000);
    const buyThemes = await this.themeRepository.getBuyThemes(user.id);

    return allThemes.map((theme) => ({
      ...theme,
      isUnlocked:
        theme.requiredCoins === 0 ||
        buyThemes.some((buyTheme) => buyTheme.id === theme.id),
    }));
  }

  async activeTheme(user: User): Promise<Theme & { isUnlocked: boolean }> {
    const theme = await this.themeRepository.getActiveTheme(user.id);

    console.log('theme', theme);

    if (!theme) {
      const defaultTheme = await this.themeRepository.getDefaultTheme();

      if (!defaultTheme) {
        throw new NotFoundException('Default theme not found');
      }

      return {
        ...defaultTheme,
        isUnlocked: true,
      };
    }

    return {
      ...theme,
      isUnlocked: true,
    };
  }

  async updateActiveTheme(user: User, id: string): Promise<boolean> {
    const theme = await this.themeRepository.getBuyTheme(user.id, id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const isCleared = await this.themeRepository.clearActiveTheme(user.id);

    if (!isCleared) {
      throw new UpdateException();
    }

    const isUpdated = await this.themeRepository.updateActiveTheme(user.id, id);

    if (!isUpdated) {
      throw new UpdateException();
    }

    return isUpdated;
  }

  private async handleUserCreated(event: UserCreatedEvent) {
    await this.createDefaultTheme(event.user);
  }

  async createDefaultTheme(user: User): Promise<boolean> {
    const defaultTheme = await this.themeRepository.getDefaultTheme();

    if (!defaultTheme) {
      throw new NotFoundException('Default theme not found');
    }

    return this.themeRepository.createUserTheme(user.id, defaultTheme.id);
  }

  async allowedThemes(
    user: User,
  ): Promise<(Theme & { isUnlocked: boolean })[]> {
    const buyThemes = await this.themeRepository.getBuyThemes(user.id);

    return buyThemes.map((theme) => ({
      ...theme,
      isUnlocked: true,
    }));
  }
}
