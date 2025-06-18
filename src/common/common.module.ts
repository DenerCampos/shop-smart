import { Module } from '@nestjs/common';
import { Pagination } from './pagination/pagination';
import { AppConfig } from './app-config/app.config';
import { ResponseService } from './response/response';

@Module({
  providers: [Pagination, AppConfig, ResponseService],
  exports: [Pagination, AppConfig, ResponseService],
})
export class CommonModule {}
