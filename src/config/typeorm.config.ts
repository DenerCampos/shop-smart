import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AppConfig } from './app.config';
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
      logging: ['query', 'error'],
      // synchronize: appConfig.isDevelopment(),
    };
  }
}
