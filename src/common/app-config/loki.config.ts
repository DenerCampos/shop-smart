import { ConfigService } from '@nestjs/config';

export interface LokiConfig {
  host: string;
  userId: string;
  apiToken: string;
  enabled: boolean;
}

const PUSH_PATH = '/loki/api/v1/push';

/**
 * Normaliza LOKI_HOST: sem barra final e sem duplicar o path de push
 * (winston-loki já concatena `/loki/api/v1/push`).
 */
export function normalizeLokiHost(raw: string): string {
  let host = (raw ?? '').trim();
  if (!host) return '';

  if (host.endsWith(PUSH_PATH)) {
    host = host.slice(0, -PUSH_PATH.length);
  }
  host = host.replace(/\/$/, '');
  return host;
}

/**
 * Lê variáveis do Loki/Grafana Cloud de forma tolerante (trim, LOKI_ENABLED flexível).
 */
export function getLokiConfig(config: ConfigService): LokiConfig {
  const enabledRaw = (config.get<string>('LOKI_ENABLED', 'false') ?? 'false')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/^['"]|['"]$/g, '');
  const enabled = ['true', '1', 'yes', 'on'].includes(enabledRaw);

  const host = normalizeLokiHost(config.get<string>('LOKI_HOST', '') ?? '');
  const userId = (config.get<string>('LOKI_USER_ID', '') ?? '').trim();
  const apiToken = (config.get<string>('LOKI_API_TOKEN', '') ?? '').trim();

  return { host, userId, apiToken, enabled };
}
