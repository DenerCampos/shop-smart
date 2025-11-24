import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface IDatabase {
  host: string;
  port: number;
  user: string;
  pass: string;
  name: string;
}

interface IApi {
  host: string;
  port: number;
}

interface ICache {
  host: string;
  port: number;
}
@Injectable()
export class AppConfig {
  private readonly configService = new ConfigService();

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
      port: Number(this.configService.get<string>('API_DB_PORT')),
      user: this.configService.get<string>('API_DB_USER'),
      pass: this.configService.get<string>('API_DB_PASS'),
      name: this.configService.get<string>('API_DB_NAME'),
    };
  }

  getApi(): IApi {
    return {
      host: this.configService.get<string>('API_HOST'),
      port: Number(this.configService.get<string>('API_PORT')),
    };
  }

  getCache(): ICache {
    return {
      host: this.configService.get<string>('API_REDIS_HOST'),
      port: Number(this.configService.get<string>('API_REDIS_PORT')),
    };
  }

  getSaltEncryption(): number {
    const saltOrRounds = Number(this.configService.get<number>('BCRYPT_SALT'));
    return saltOrRounds ?? 10;
  }

  getJwtSecretKey(): string {
    const jwtSecretKey = this.configService.get<string>('JWT_SECRET_KEY');
    return jwtSecretKey ?? 'demos crest';
  }

  getBaseUrl(): string {
    const apiHost = this.getApi();

    if (this.isDevelopment()) return `http://${apiHost.host}:${apiHost.port}`;

    return `https://${apiHost.host}:${apiHost.port}`;
  }

  getDefaultRecognitionProvider(): string {
    return this.configService.get<string>(
      'DEFAULT_RECOGNITION_PROVIDER',
      'gemini',
    );
  }

  getGoogleApiKey(): string {
    return this.configService.get<string>('GOOGLE_API_KEY');
  }

  getGeminiDailyLimit(): number {
    return Number.parseInt(
      this.configService.get<string>('GEMINI_DAILY_LIMIT') || '50',
      10,
    );
  }

  getGeminiAudioDailyLimit(): number {
    return Number.parseInt(
      this.configService.get<string>('GEMINI_AUDIO_DAILY_LIMIT') || '50',
      10,
    );
  }
}
