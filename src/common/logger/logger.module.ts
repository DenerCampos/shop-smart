import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { getLokiConfig } from '../app-config/loki.config';

// winston-loki usa export = (CommonJS); default import vira undefined em runtime
import LokiTransport = require('winston-loki');

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
        const nodeEnv = (config.get<string>('NODE_ENV') ?? 'development').toLowerCase();
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
          level: isDev ? 'debug' : 'warn',
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
