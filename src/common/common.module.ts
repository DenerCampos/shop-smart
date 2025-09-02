import { Module } from '@nestjs/common';
import { Pagination } from './pagination/pagination';
import { AppConfig } from './app-config/app.config';
import { ResponseService } from './response/response';
import { QueryRunnerFactory } from './query-runner/queryRunner.factory';
import {
  EventEmitterProvider,
  EVENT_EMITTER,
} from './event-emitter/event-emitter.provider';

@Module({
  providers: [
    Pagination,
    AppConfig,
    ResponseService,
    QueryRunnerFactory,
    EventEmitterProvider,
  ],
  exports: [
    Pagination,
    AppConfig,
    ResponseService,
    QueryRunnerFactory,
    EventEmitterProvider,
    EVENT_EMITTER,
  ],
})
export class CommonModule {}
