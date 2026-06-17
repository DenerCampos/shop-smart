import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getLokiConfig, LokiConfig } from './loki.config';

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

  /**
   * Número de proxies confiáveis na frente da API (Express `trust proxy`).
   * Ex.: 1 com Nginx/Ingress. 0 = desligado (acesso direto ou sem encadear IP).
   */
  getTrustProxyHops(): number {
    const raw = this.configService.get<string>('API_TRUST_PROXY_HOPS', '0');
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
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

  getFrontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
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

  getGeminiTextDailyLimit(): number {
    return Number.parseInt(
      this.configService.get<string>('GEMINI_TEXT_DAILY_LIMIT') || '50',
      10,
    );
  }

  getGoogleDrive() {
    return {
      clientId: this.configService.get<string>('GOOGLE_DRIVE_CLIENT_ID'),
      clientSecret: this.configService.get<string>(
        'GOOGLE_DRIVE_CLIENT_SECRET',
      ),
      refreshToken: this.configService.get<string>(
        'GOOGLE_DRIVE_REFRESH_TOKEN',
      ),
      folderId: this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID'),
    };
  }

  getGoogleDriveRateLimit(): number {
    return Number.parseInt(
      this.configService.get<string>('GOOGLE_DRIVE_RATE_LIMIT') || '50',
      10,
    );
  }

  getSupabaseStorage() {
    const rawUrl = this.configService.get<string>('SUPABASE_URL') ?? '';
    return {
      url: this.normalizeSupabaseUrl(rawUrl),
      key: this.configService.get<string>('SUPABASE_KEY') ?? '',
      bucket:
        this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ??
        'shop-smart',
    };
  }

  getFileStorageProvider(): 'supabase' | 'google-drive' {
    const provider = this.configService.get<string>(
      'FILE_STORAGE_PROVIDER',
      'supabase',
    );
    return provider === 'google-drive' ? 'google-drive' : 'supabase';
  }

  /** URL base do projeto Supabase (sem /rest/v1 nem barra final). */
  private normalizeSupabaseUrl(url: string): string {
    return url
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/rest\/v1\/?$/i, '');
  }

  getLoki(): LokiConfig {
    return getLokiConfig(this.configService);
  }

  isDemoEnabled(): boolean {
    const raw = (
      this.configService.get<string>('DEMO_ENABLED', 'false') ?? 'false'
    )
      .toString()
      .toLowerCase()
      .trim();
    return ['true', '1', 'yes', 'on'].includes(raw);
  }

  getDemoSecret(): string {
    return (this.configService.get<string>('DEMO_SECRET') ?? '').trim();
  }

  getDemoUserEmail(): string {
    return (
      this.configService.get<string>(
        'DEMO_USER_EMAIL',
        'demo@superfamilyquest.com',
      ) ?? 'demo@superfamilyquest.com'
    ).trim();
  }

  /**
   * Origens CORS para HTTP (Express) e WebSocket (Socket.IO), alinhadas a main.ts.
   */
  getCorsOrigins(): (string | RegExp)[] {
    if (this.isDevelopment()) {
      return [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://superfamilyquest.netlify.app',
        /\.ngrok-free\.app$/,
      ];
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return frontendUrl
      ? [frontendUrl, /\.ngrok-free\.app$/]
      : [/\.ngrok-free\.app$/];
  }
}
