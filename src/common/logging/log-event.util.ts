import { Logger } from '@nestjs/common';

/** Contexto fixo para filtros no Loki/Grafana (ex.: `{app="shop-smart-api"} | json | context="Observability"`). */
export const OBSERVABILITY_CONTEXT = 'Observability';

/**
 * Uma linha JSON por evento — use `| json` no Explore (Loki).
 *
 * Exemplos LogQL:
 * - `{app="shop-smart-api"} | json | event="http_request"`
 * - `{app="shop-smart-api"} | json | event="ai_provider_call" | ok="false"`
 * - `{app="shop-smart-api"} | json | event="quota_exceeded"`
 */
export function logJson(
  logger: Logger,
  payload: Record<string, unknown>,
  level: 'log' | 'warn' | 'error' = 'log',
): void {
  const line = JSON.stringify(payload);
  if (level === 'warn') {
    logger.warn(line, OBSERVABILITY_CONTEXT);
  } else if (level === 'error') {
    logger.error(line, undefined, OBSERVABILITY_CONTEXT);
  } else {
    logger.log(line, OBSERVABILITY_CONTEXT);
  }
}
