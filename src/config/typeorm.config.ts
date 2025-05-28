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
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/db/migrations/*.js'],
      logging:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error']
          : ['error', 'warn'], // Em produção mostra apenas erros e warnings
      maxQueryExecutionTime: 1000, // Loga queries lentas (>1s)
      ssl: {
        ca: process.env.SSL_CERT ?? null,
        rejectUnauthorized: false,
      },
      // Adicionar configurações específicas do MySQL
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
      // Configurações para evitar problemas com UUID e migrations
      migrationsTableName: 'migrations',
      migrationsRun: false,
      // Adicionar estas opções para maior controle
      dropSchema: false,
      // synchronize: appConfig.isDevelopment(),
    };
  }
}
