import { Module } from '@nestjs/common';
import { Pagination } from './pagination/pagination';
import { AppConfig } from './app-config/app.config';
import { ResponseService } from './response/response';
import { QueryRunnerFactory } from './query-runner/queryRunner.factory';

@Module({
  providers: [Pagination, AppConfig, ResponseService, QueryRunnerFactory],
  exports: [Pagination, AppConfig, ResponseService, QueryRunnerFactory],
})
export class CommonModule {}
