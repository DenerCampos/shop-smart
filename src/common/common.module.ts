import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pagination } from './pagination/pagination';
import { AppConfig } from './app-config/app.config';
import { ResponseService } from './response/response';
import { QueryRunnerFactory } from './query-runner/queryRunner.factory';
import {
  EventEmitterProvider,
  EVENT_EMITTER,
} from './event-emitter/event-emitter.provider';
import { ApiUsage } from './ai-quota/entities/apiUsage.entity';
import { ApiUsageRepository } from './ai-quota/repositories/apiUsage.repository';
import { ApiQuotaService } from './ai-quota/services/apiQuota.service';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';
import { FamilyMemberResolverService } from './family-member-resolver/family-member-resolver.service';
import { LoggerModule } from './logger/logger.module';
import { AppLoggerService } from './logger/logger.service';
import { SecurityAuditLogService } from './logging/security-audit-log.service';
import { AiCallTelemetryService } from './logging/ai-call-telemetry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiUsage, FamilyGroupMember]),
    LoggerModule,
  ],
  providers: [
    Pagination,
    AppConfig,
    ResponseService,
    QueryRunnerFactory,
    EventEmitterProvider,
    ApiQuotaService,
    FamilyMemberResolverService,
    AppLoggerService,
    SecurityAuditLogService,
    AiCallTelemetryService,
    {
      provide: 'IApiUsageRepository',
      useClass: ApiUsageRepository,
    },
  ],
  exports: [
    Pagination,
    AppConfig,
    ResponseService,
    QueryRunnerFactory,
    EventEmitterProvider,
    EVENT_EMITTER,
    ApiQuotaService,
    FamilyMemberResolverService,
    AppLoggerService,
    SecurityAuditLogService,
    AiCallTelemetryService,
    LoggerModule,
    'IApiUsageRepository',
  ],
})
export class CommonModule {}
