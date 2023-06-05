import { ConfigService } from '@nestjs/config';

interface IDatabase {
  host: string;
  port: string;
  user: string;
  pass: string;
  name: string;
}

interface IApi {
  host: string;
  port: string;
}

interface ICache {
  host: string;
  port: string;
}

export class AppConfig {
  private configService = new ConfigService();

  getEnvironment(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  isDevelopment(): boolean {
    const env = this.configService.get<string>('NODE_ENV');
    return env === 'development';
  }

  getDatabase(): IDatabase {
    return {
      host: this.configService.get<string>('API_DB_HOST'),
      port: this.configService.get<string>('API_DB_PORT'),
      user: this.configService.get<string>('API_DB_USER'),
      pass: this.configService.get<string>('API_DB_PASS'),
      name: this.configService.get<string>('API_DB_NAME'),
    };
  }

  getApi(): IApi {
    return {
      host: this.configService.get<string>('API_HOST'),
      port: this.configService.get<string>('API_PORT'),
    };
  }

  getCache(): ICache {
    return {
      host: this.configService.get<string>('API_REDIS_HOST'),
      port: this.configService.get<string>('API_REDIS_PORT'),
    };
  }
}
