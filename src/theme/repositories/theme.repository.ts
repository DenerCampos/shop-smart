import { Injectable } from '@nestjs/common';
import { IThemeRepository } from '../interfaces/theme.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Theme } from '../entities/theme.entity';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { User } from 'src/user/entities/user.entity';
import { UserTheme } from '../entities/user-theme.entity';

@Injectable()
export class ThemeRepository implements IThemeRepository {
  constructor(
    @InjectRepository(Theme)
    private themeEntity: Repository<Theme>,
    @InjectRepository(UserTheme)
    private userThemeEntity: Repository<UserTheme>,
  ) {}

  async create(
    createThemeDto: CreateThemeDto,
    manager?: EntityManager,
  ): Promise<Theme> {
    const repository = manager
      ? manager.getRepository(Theme)
      : this.themeEntity;

    const newTheme = repository.create(createThemeDto);

    return await repository.save(newTheme);
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Theme[], number]> {
    const queryBuilder = this.themeEntity.createQueryBuilder('theme');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    if (search) {
      queryBuilder.where('theme.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('theme.createdAt', 'ASC');

    return await queryBuilder.getManyAndCount();
  }

  async countAll(): Promise<number> {
    return await this.themeEntity.count({
      withDeleted: false,
    });
  }

  async find(id: string): Promise<Theme | null> {
    return await this.themeEntity.findOneBy({ id });
  }

  async update(
    theme: Theme,
    updateThemeDto: UpdateThemeDto,
    manager?: EntityManager,
  ): Promise<Theme> {
    const repository = manager
      ? manager.getRepository(Theme)
      : this.themeEntity;

    return await repository.save({
      ...theme,
      ...updateThemeDto,
    });
  }

  async remove(theme: Theme): Promise<Theme> {
    await this.themeEntity.remove(theme);

    return theme;
  }

  async delete(theme: Theme): Promise<Theme> {
    await this.themeEntity.softDelete({ id: theme.id });

    return theme;
  }

  async getBuyThemes(userId: string): Promise<Theme[]> {
    return await this.themeEntity
      .createQueryBuilder('theme')
      .innerJoin('theme.users', 'userTheme')
      .innerJoin('userTheme.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }

  async getActiveTheme(userId: string): Promise<Theme | null> {
    return await this.themeEntity
      .createQueryBuilder('theme')
      .innerJoin('theme.users', 'userTheme')
      .where('userTheme.userId = :userId', { userId })
      .andWhere('userTheme.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async getDefaultTheme(): Promise<Theme | null> {
    return await this.themeEntity
      .createQueryBuilder('theme')
      .where('theme.requiredCoins = :requiredCoins', { requiredCoins: 0 })
      .orderBy('theme.createdAt', 'ASC')
      .getOne();
  }

  async getBuyTheme(userId: string, themeId: string): Promise<Theme | null> {
    return await this.themeEntity
      .createQueryBuilder('theme')
      .innerJoin('theme.users', 'userTheme')
      .where('userTheme.userId = :userId', { userId })
      .andWhere('theme.id = :themeId', { themeId })
      .getOne();
  }

  async clearActiveTheme(userId: string): Promise<boolean> {
    await this.userThemeEntity
      .createQueryBuilder()
      .update(UserTheme)
      .set({ isActive: false })
      .where('userId = :userId', { userId })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();

    return true;
  }

  async updateActiveTheme(userId: string, themeId: string): Promise<boolean> {
    const userTheme = await this.userThemeEntity.findOne({
      where: {
        userId,
        themeId,
      },
    });

    if (!userTheme) {
      return false;
    }

    await this.userThemeEntity
      .createQueryBuilder()
      .update(UserTheme)
      .set({ isActive: true })
      .where('id = :id', { id: userTheme.id })
      .execute();

    return true;
  }

  async createUserTheme(userId: string, themeId: string): Promise<boolean> {
    const userTheme = this.userThemeEntity.create({
      userId,
      themeId,
      isActive: true,
    });

    await this.userThemeEntity.save(userTheme);

    return true;
  }
}
