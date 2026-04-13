import { Injectable, Logger } from '@nestjs/common';
import { ApiQuotaException } from '../ai-quota/exceptions/apiQuota.exception';
import { logJson } from './log-event.util';

export type AiTelemetryFeature =
  | 'image_recognition'
  | 'text_recognition'
  | 'audio_recognition';

@Injectable()
export class AiCallTelemetryService {
  private readonly logger = new Logger(AiCallTelemetryService.name);

  async measure<T>(
    feature: AiTelemetryFeature,
    provider: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration_ms = Date.now() - start;
      logJson(this.logger, {
        event: 'ai_provider_call',
        feature,
        provider,
        duration_ms,
        ok: true,
      });
      return result;
    } catch (err) {
      const duration_ms = Date.now() - start;
      let failure = 'unknown';
      if (err instanceof ApiQuotaException) {
        failure = 'quota';
      }
      const error_message =
        err instanceof Error
          ? err.message.slice(0, 500)
          : String(err).slice(0, 500);
      logJson(
        this.logger,
        {
          event: 'ai_provider_call',
          feature,
          provider,
          duration_ms,
          ok: false,
          failure,
          error_message,
        },
        'warn',
      );
      throw err;
    }
  }
}
