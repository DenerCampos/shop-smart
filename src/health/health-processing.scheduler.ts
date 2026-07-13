import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { logJson } from 'src/common/logging/log-event.util';
import { HealthService } from './health.service';

@Injectable()
export class HealthProcessingScheduler {
  private readonly logger = new Logger(HealthProcessingScheduler.name);

  constructor(private readonly healthService: HealthService) {}

  /** Roda a cada 2 minutos — processa até 3 arquivos QUEUED e FAILED elegíveis para retry automático (após 2 h). */
  @Cron('*/2 * * * *', { timeZone: 'America/Sao_Paulo' })
  async processQueue(): Promise<void> {
    try {
      await this.healthService.processNextQueued();
    } catch (err) {
      logJson(
        this.logger,
        {
          event: 'health_processing_cron_failed',
          error_message: err instanceof Error ? err.message : String(err),
        },
        'error',
      );
    }
  }
}
