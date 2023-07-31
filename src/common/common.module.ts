import { Module } from '@nestjs/common';
import { Pagination } from './pagination/pagination';
import { AppConfig } from './app-config/app.config';

@Module({
  providers: [Pagination, AppConfig],
  exports: [Pagination, AppConfig],
})
export class CommonModule {}
