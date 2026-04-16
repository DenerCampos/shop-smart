import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AppConfig } from '../common/app-config/app.config';
import 'dotenv/config';

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const appConfig = new AppConfig();
    const { host, port, user, pass, name } = appConfig.getDatabase();

    return {
      type: 'mysql',
      host: host ?? process.env.API_DB_HOST,
      port: port ?? Number(process.env.API_DB_PORT),
      username: user ?? process.env.API_DB_USER,
      password: pass ?? process.env.API_DB_PASS,
      database: name ?? process.env.API_DB_NAME,
      autoLoadEntities: true,
      migrations: ['dist/db/migrations/*.js'],
      logging:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error']
          : ['error', 'warn'], // Em produção mostra apenas erros e warnings
      maxQueryExecutionTime: 1000, // Loga queries lentas (>1s)
      // ssl: {
      //   ca: process.env.SSL_CERT ?? null,
      //   rejectUnauthorized: false,
      // },
      ssl: false,
      // Configurações para evitar problemas com UUID e migrations
      migrationsTableName: 'migrations',
      migrationsRun: false,
      // Adicionar estas opções para maior controle
      dropSchema: false,
      // synchronize: appConfig.isDevelopment(),
      // Configurações CRÍTICAS para plano free:
      poolSize: 4, // Máximo de conexões simultâneas
      // Opções do pool mysql2 (não repetir ssl aqui — já em `ssl` acima).
      // allowPublicKeyRetrieval em `extra` gera aviso no mysql2 3.x; usar auth nativa ou root com plugin compatível.
      extra: {
        charset: 'utf8mb4_unicode_ci',
        connectionLimit: 4, // Igual ao poolSize
        idleTimeout: 30000, // Fecha conexões ociosas após 30s
        enableKeepAlive: true, // Mantém conexões vivas
      },
      retryAttempts: 3, // Número de tentativas de reconexão
      retryDelay: 3000, // Delay entre tentativas (3 segundos)
    };
  }
}
