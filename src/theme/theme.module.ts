import { Module } from '@nestjs/common';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { ThemeRepository } from './repositories/theme.repository';
import { Theme } from './entities/theme.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { UserTheme } from './entities/user-theme.entity';

@Module({
  imports: [
    CommonModule,
    UserModule,
    TypeOrmModule.forFeature([Theme, UserTheme]),
  ],
  controllers: [ThemeController],
  providers: [
    ThemeService,
    {
      provide: 'IThemeRepository',
      useClass: ThemeRepository,
    },
    {
      provide: 'IUserThemeRepository',
      useClass: ThemeRepository,
    },
  ],
  exports: [ThemeService, 'IThemeRepository', 'IUserThemeRepository'],
})
export class ThemeModule {}
