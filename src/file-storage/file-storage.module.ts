import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AppConfig } from 'src/common/app-config/app.config';
import { FILE_STORAGE } from './file-storage.constants';
import { LegacyAwareFileStorageService } from './legacy-aware-file-storage.service';

@Module({
  imports: [CommonModule],
  providers: [
    {
      provide: FILE_STORAGE,
      useFactory: (appConfig: AppConfig) =>
        new LegacyAwareFileStorageService(appConfig),
      inject: [AppConfig],
    },
  ],
  exports: [FILE_STORAGE],
})
export class FileStorageModule {}
