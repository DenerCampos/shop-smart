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

@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage, FamilyGroupMember])],
  providers: [
    Pagination,
    AppConfig,
    ResponseService,
    QueryRunnerFactory,
    EventEmitterProvider,
    ApiQuotaService,
    FamilyMemberResolverService,
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
    'IApiUsageRepository',
  ],
})
export class CommonModule {}
