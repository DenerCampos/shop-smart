import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { getLokiConfig } from '../app-config/loki.config';

// winston-loki usa export = (CommonJS); default import vira undefined em runtime
import LokiTransport = require('winston-loki');

const WINSTON_LEVELS = new Set([
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]);

/** Padrão: debug em dev, warn em prod (menos ruído). Use API_LOG_LEVEL=info para incluir http_request no Loki. */
function resolveWinstonLevel(config: ConfigService, isDev: boolean): string {
  const raw = (config.get<string>('API_LOG_LEVEL') ?? '').trim().toLowerCase();
  if (raw && WINSTON_LEVELS.has(raw)) {
    return raw;
  }
  if (raw) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Logger] API_LOG_LEVEL="${raw}" inválido; use um de: ${[...WINSTON_LEVELS].join(', ')}. Usando padrão (${isDev ? 'debug' : 'warn'}).`,
    );
  }
  return isDev ? 'debug' : 'warn';
}

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const ctx = context ? `[${context}]` : '';
      const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level} ${ctx} ${message}${extra}`;
    }),
  ),
});

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = (
          config.get<string>('NODE_ENV') ?? 'development'
        ).toLowerCase();
        const isDev = nodeEnv === 'development';

        const loki = getLokiConfig(config);
        const transports: winston.transport[] = [consoleTransport];

        const lokiReady =
          loki.enabled && Boolean(loki.host && loki.userId && loki.apiToken);

        if (loki.enabled && !lokiReady) {
          // eslint-disable-next-line no-console
          console.warn(
            '[Loki] LOKI_ENABLED=true mas faltam LOKI_HOST, LOKI_USER_ID ou LOKI_API_TOKEN — envio ao Grafana desativado.',
          );
        }

        if (lokiReady) {
          transports.push(
            new LokiTransport({
              host: loki.host,
              basicAuth: `${loki.userId}:${loki.apiToken}`,
              labels: {
                app: 'shop-smart-api',
                env: isDev ? 'development' : 'production',
              },
              json: true,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              batching: true,
              interval: 5,
              onConnectionError: (err: unknown) => {
                const msg =
                  err instanceof Error ? err.message : JSON.stringify(err);
                // eslint-disable-next-line no-console
                console.error('[Loki] Falha ao enviar logs:', msg);
              },
            }),
          );
          // eslint-disable-next-line no-console
          console.info(
            `[Loki] Transport ativo → ${loki.host} (labels: app=shop-smart-api, env=${isDev ? 'development' : 'production'})`,
          );
        }

        return {
          level: resolveWinstonLevel(config, isDev),
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
