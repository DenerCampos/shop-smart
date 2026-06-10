import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { Theme } from '../entities/theme.entity';
import { EntityManager } from 'typeorm';

export interface IThemeRepository {
  create(newTheme: CreateThemeDto, manager?: EntityManager): Promise<Theme>;
  findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Theme[], number]>;
  find(id: string): Promise<Theme | null>;
  update(
    theme: Theme,
    updateTheme: UpdateThemeDto,
    manager?: EntityManager,
  ): Promise<Theme>;
  remove(theme: Theme): Promise<Theme>;
  delete(theme: Theme): Promise<Theme>;
  countAll(): Promise<number>;
  getBuyThemes(userId: string): Promise<Theme[]>;
  getActiveTheme(userId: string): Promise<Theme | null>;
  getDefaultTheme(): Promise<Theme | null>;
  updateActiveTheme(userId: string, themeId: string): Promise<boolean>;
  getBuyTheme(userId: string, themeId: string): Promise<Theme | null>;
  clearActiveTheme(userId: string): Promise<boolean>;
  createUserTheme(userId: string, themeId: string): Promise<boolean>;
}
