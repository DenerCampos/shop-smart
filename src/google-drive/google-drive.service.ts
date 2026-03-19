import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { AppConfig } from 'src/common/app-config/app.config';
import { GoogleDriveUploadResult } from './interfaces/google-drive.interface';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: drive_v3.Drive;
  private readonly folderId: string;
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly maxRequestsPerMinute: number;

  constructor(private readonly appConfig: AppConfig) {
    const config = this.appConfig.getGoogleDrive();
    this.folderId = config.folderId ?? '';
    this.maxRequestsPerMinute = this.appConfig.getGoogleDriveRateLimit();
    this.initializeDrive(config);
  }

  private validateConfig(config: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    folderId?: string;
  }): void {
    const required = ['clientId', 'clientSecret', 'refreshToken', 'folderId'];
    const missing = required.filter(
      (key) => !String(config[key as keyof typeof config] ?? '').trim(),
    );
    if (missing.length > 0) {
      throw new InternalServerErrorException(
        `Configuração do Google Drive incompleta. Variáveis ausentes: ${missing.join(
          ', ',
        )}. Verifique GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN e GOOGLE_DRIVE_FOLDER_ID.`,
      );
    }
  }

  private initializeDrive(config: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): void {
    try {
      const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
      );

      oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
      });

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      this.logger.error('Falha ao inicializar Google Drive', error.message);
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastResetTime;

    if (elapsed >= 60_000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60_000 - elapsed;
      this.logger.warn(
        `Rate limit atingido. Aguardando ${waitTime}ms antes de prosseguir.`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<GoogleDriveUploadResult> {
    this.validateConfig(this.appConfig.getGoogleDrive());
    await this.checkRateLimit();

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [this.folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id,name,webViewLink,webContentLink',
    });

    await this.checkRateLimit();

    try {
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao definir permissão pública do arquivo ${response.data.id}`,
        error?.message,
      );
    }

    const directImageUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return {
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: directImageUrl,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.checkRateLimit();
      await this.drive.files.delete({ fileId });
    } catch (error) {
      this.logger.warn(
        `Falha ao deletar arquivo ${fileId} do Google Drive`,
        error.message,
      );
    }
  }

  extractFileIdFromUrl(url: string): string | null {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}
