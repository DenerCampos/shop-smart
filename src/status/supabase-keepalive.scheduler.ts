import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppConfig } from 'src/common/app-config/app.config';
import { logJson } from 'src/common/logging/log-event.util';
import { SupabaseStorageService } from 'src/supabase-storage/supabase-storage.service';

/** Intervalo mínimo entre pings bem-sucedidos (5 dias). */
export const SUPABASE_KEEPALIVE_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000;

const KEEP_ALIVE_TIMEZONE = 'America/Sao_Paulo';

@Injectable()
export class SupabaseKeepaliveScheduler {
  private readonly logger = new Logger(SupabaseKeepaliveScheduler.name);
  private lastSuccessAtMs: number | null = null;

  constructor(
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly appConfig: AppConfig,
  ) {}

  /**
   * Roda todo dia às 04:00 (America/Sao_Paulo).
   * Só chama o Supabase se o provider ativo for supabase, a config estiver
   * preenchida, e nunca houve sucesso ou o último sucesso foi há 5 dias ou mais.
   */
  @Cron('0 4 * * *', { timeZone: KEEP_ALIVE_TIMEZONE })
  async keepAlive(): Promise<void> {
    const skipReason = this.resolveSkipReason();
    if (skipReason) {
      logJson(this.logger, {
        event: 'supabase_keepalive_skipped',
        reason: skipReason,
      });
      return;
    }

    const nowMs = Date.now();
    if (!this.shouldPing(nowMs)) {
      return;
    }

    try {
      await this.supabaseStorage.ping();
      this.lastSuccessAtMs = Date.now();
      logJson(this.logger, { event: 'supabase_keepalive_ok' });
    } catch (err) {
      logJson(
        this.logger,
        {
          event: 'supabase_keepalive_failed',
          error_message: err instanceof Error ? err.message : String(err),
        },
        'error',
      );
    }
  }

  /**
   * Google Drive (ou config Supabase vazia) não deve gerar erro diário.
   * Não grava último sucesso: no dia seguinte o cron avalia de novo.
   */
  private resolveSkipReason():
    | 'provider_not_supabase'
    | 'config_incomplete'
    | null {
    if (this.appConfig.getFileStorageProvider() !== 'supabase') {
      return 'provider_not_supabase';
    }

    const { url, key, bucket } = this.appConfig.getSupabaseStorage();
    if (!url.trim() || !key.trim() || !bucket.trim()) {
      return 'config_incomplete';
    }

    return null;
  }

  /** Público para testes unitários do gate de 5 dias. */
  shouldPing(nowMs: number): boolean {
    if (this.lastSuccessAtMs === null) {
      return true;
    }
    return nowMs - this.lastSuccessAtMs >= SUPABASE_KEEPALIVE_INTERVAL_MS;
  }
}
