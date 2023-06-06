import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AppConfig } from './app.config';

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const appConfig = new AppConfig();
    const { host, port, user, pass, name } = appConfig.getDatabase();

    return {
      type: 'mysql',
      host: host,
      port: port,
      username: user,
      password: pass,
      database: name,
      entities: ['dist/**/*.entity.js'],
      synchronize: appConfig.isDevelopment(),
    };
  }
}
